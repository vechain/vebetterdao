import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().xAllocationVotingContractAddress as `0x${string}`
const abi = XAllocationVoting__factory.abi
const method = "isUserAutoVotingEnabled" as const

/**
 * Returns the query key for checking if auto-voting is enabled for a user.
 * @param userAddress The address of the user to check
 * @returns The query key for checking if auto-voting is enabled for a user.
 */
export const getIsAutoVotingEnabledQueryKey = (userAddress: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [userAddress as `0x${string}`],
  })

/**
 * Hook to check if auto-voting is enabled for a user
 * @param userAddress The address of the user to check
 * @returns boolean indicating if auto-voting is enabled
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
