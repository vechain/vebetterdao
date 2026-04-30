import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/x-allocation-voting-governance/XAllocationVoting__factory"
import { executeMultipleClausesCall, useThor, useWallet } from "@vechain/vechain-kit"

const address = getConfig().xAllocationVotingContractAddress as `0x${string}`
const abi = XAllocationVoting__factory.abi

/**
 * Returns the query key for checking if auto-voting is enabled for a user across multiple rounds.
 * @param userAddress The address of the user to check
 * @param roundIds The round IDs to check
 * @returns The query key for checking if auto-voting is enabled for the rounds.
 */
export const getIsAutoVotingEnabledForRoundsQueryKey = (userAddress: string, roundIds: string[]) => {
  // Use sorted roundIds for stable query key (prevents unnecessary refetches when array reference changes)
  const sortedRoundIds = [...roundIds].sort((a, b) => Number(a) - Number(b))
  return ["isAutoVotingEnabledForRounds", userAddress, sortedRoundIds]
}

/**
 * Hook to check if auto-voting was active for the current authenticated user across multiple rounds.
 * This checks the auto-voting status at the start of each round (snapshot).
 *
 * @param roundIds Array of round IDs to check
 * @returns Record of roundId to boolean indicating if auto-voting was active for that round
 */
export const useIsAutoVotingEnabledForRounds = (roundIds: string[]) => {
  const { account } = useWallet()
  const thor = useThor()

  return useQuery({
    queryKey: getIsAutoVotingEnabledForRoundsQueryKey(account?.address ?? "", roundIds),
    enabled: !!thor && !!account?.address && roundIds.length > 0,
    queryFn: async () => {
      try {
        const results = await executeMultipleClausesCall({
          thor,
          calls: roundIds.map(
            roundId =>
              ({
                abi,
                address,
                functionName: "isUserAutoVotingEnabledForRound",
                args: [account!.address as `0x${string}`, BigInt(roundId)],
              }) as const,
          ),
        })

        // Create a record of roundId -> isActive
        const activeMap: Record<string, boolean> = {}
        results.forEach((isActive, index) => {
          const roundId = roundIds[index]
          if (roundId) {
            activeMap[roundId] = Boolean(isActive)
          }
        })

        return activeMap
      } catch (error) {
        console.error("Error fetching auto-voting status for rounds:", error)
        return {} as Record<string, boolean>
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
