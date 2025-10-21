import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().xAllocationVotingContractAddress
const abi = XAllocationVoting__factory.abi
const method = "isUserAutoVotingEnabled" as const

/**
 * Returns the query key for fetching if auto-voting is enabled for a user.
 * @param userAddress The user address to check
 * @returns The query key for fetching if auto-voting is enabled
 */
export const getIsAutoVotingEnabledQueryKey = (userAddress?: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [userAddress as `0x${string}`],
  })

/**
 * Hook to check if auto-voting is enabled for a user
 * @param userAddress The address to check if auto-voting is enabled
 * @returns Boolean indicating if auto-voting is enabled for the user
 */
export const useIsAutoVotingEnabled = (userAddress?: string) => {
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
