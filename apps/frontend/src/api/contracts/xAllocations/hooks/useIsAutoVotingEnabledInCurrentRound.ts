import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().xAllocationVotingContractAddress
const abi = XAllocationVoting__factory.abi
const method = "isUserAutoVotingEnabledInCurrentRound" as const

/**
 * Returns the query key for fetching if auto-voting is enabled for a user in the current round.
 * @param userAddress The user address to check
 * @returns The query key for fetching if auto-voting is enabled in current round
 */
export const getIsAutoVotingEnabledInCurrentRoundQueryKey = (userAddress?: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [userAddress as `0x${string}`],
  })

/**
 * Hook to check if auto-voting is enabled for a user in the current round.
 * This checks if auto-voting was enabled at the start of the current cycle.
 * Status changes mid-cycle will only take effect in the next cycle.
 * @param userAddress The address to check if auto-voting is enabled in current round
 * @returns Boolean indicating if auto-voting is enabled for the user in current round
 */
export const useIsAutoVotingEnabledInCurrentRound = (userAddress?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [(userAddress || "") as `0x${string}`],
    queryOptions: {
      enabled: !!userAddress,
      select: data => data[0],
    },
  })
}
