import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().xAllocationVotingContractAddress
const abi = XAllocationVoting__factory.abi
const method = "getUserVotingPreferences" as const

/**
 * Returns the query key for fetching user voting preferences.
 * @param userAddress The user address to check
 * @returns The query key for fetching user voting preferences
 */
export const getUserVotingPreferencesQueryKey = (userAddress?: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [userAddress as `0x${string}`],
  })

/**
 * Hook to get the voting preferences (app IDs) for a user
 * @param userAddress The address to get voting preferences for
 * @returns Array of app IDs (bytes32[]) that the user has set as preferences
 */
export const useUserVotingPreferences = (userAddress?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [(userAddress || "") as `0x${string}`],
    queryOptions: {
      enabled: !!userAddress,
      select: data => data[0] as string[],
    },
  })
}
