import { getConfig } from "@repo/config"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"

const abi = NavigatorRegistry__factory.abi
const address = getConfig().navigatorRegistryContractAddress as `0x${string}`

export type SlashedRoundResult = {
  slashed: boolean
  infractionFlags: number
}

export const useIsSlashedFor = (navigator: string, roundIds: string[]) => {
  const thor = useThor()
  const uniqueRoundIds = [...new Set(roundIds)]

  return useQuery({
    queryKey: ["isSlashedForRound", navigator, uniqueRoundIds],
    queryFn: async () => {
      const results = await executeMultipleClausesCall({
        thor,
        calls: uniqueRoundIds.map(
          roundId =>
            ({
              abi,
              address,
              functionName: "isSlashedForRound" as const,
              args: [navigator as `0x${string}`, BigInt(roundId)],
            }) as const,
        ),
      })

      const byRound = new Map<string, SlashedRoundResult>()
      uniqueRoundIds.forEach((roundId, i) => {
        const [slashed, infractionFlags] = results[i] as [boolean, bigint]
        byRound.set(roundId, {
          slashed,
          infractionFlags: Number(infractionFlags),
        })
      })

      return byRound
    },
    enabled: !!thor && !!navigator && !!address && uniqueRoundIds.length > 0,
    placeholderData: keepPreviousData,
  })
}
