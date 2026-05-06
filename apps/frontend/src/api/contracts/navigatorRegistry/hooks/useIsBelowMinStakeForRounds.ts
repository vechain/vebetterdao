import { getConfig } from "@repo/config"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"

const abi = NavigatorRegistry__factory.abi
const address = getConfig().navigatorRegistryContractAddress as `0x${string}`

type RoundCheckpoint = {
  roundId: string
  snapshot: number
  deadline: number
}

/**
 * Checks whether a navigator was below minStake at both round start (snapshot)
 * AND round end (deadline) for each given round — matching the contract's
 * two-checkpoint belowMinStake logic.
 */
export const useIsBelowMinStakeForRounds = (navigator: string, rounds: RoundCheckpoint[]) => {
  const thor = useThor()

  return useQuery({
    queryKey: ["isBelowMinStakeForRounds", navigator, rounds.map(r => r.roundId)],
    queryFn: async () => {
      // Build calls: for each round we need getStakedAmountAtTimepoint at snapshot and deadline, plus one getMinStake
      const calls = [
        { abi, address, functionName: "getMinStake" as const, args: [] } as const,
        ...rounds.flatMap(r => [
          {
            abi,
            address,
            functionName: "getStakedAmountAtTimepoint" as const,
            args: [navigator as `0x${string}`, BigInt(r.snapshot)],
          } as const,
          {
            abi,
            address,
            functionName: "getStakedAmountAtTimepoint" as const,
            args: [navigator as `0x${string}`, BigInt(r.deadline)],
          } as const,
        ]),
      ]

      const results = await executeMultipleClausesCall({ thor, calls })

      const minStake = results[0] as bigint
      const byRound = new Set<string>()

      rounds.forEach((r, i) => {
        const stakeAtStart = results[1 + i * 2] as bigint
        const stakeAtEnd = results[2 + i * 2] as bigint
        if (stakeAtStart > 0n && stakeAtStart < minStake && stakeAtEnd < minStake) {
          byRound.add(r.roundId)
        }
      })

      return byRound
    },
    enabled: !!thor && !!navigator && !!address && rounds.length > 0,
    placeholderData: keepPreviousData,
  })
}
