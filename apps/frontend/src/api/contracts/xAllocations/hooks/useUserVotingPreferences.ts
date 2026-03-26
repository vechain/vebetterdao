import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/x-allocation-voting-governance/XAllocationVoting__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().xAllocationVotingContractAddress as `0x${string}`
const abi = XAllocationVoting__factory.abi
const method = "getUserVotingPreferences" as const

/**
 * Returns the query key for fetching user's voting preferences.
 * @param userAddress The address of the user
 * @returns The query key for fetching user's voting preferences
 */
export const getUserVotingPreferencesQueryKey = (userAddress: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [userAddress as `0x${string}`],
  })

/**
 * Hook to get user's voting preferences (app IDs they've selected for auto-voting)
 * @param userAddress The address of the user
 * @returns Array of app IDs (as bytes32[]) that the user has set as preferences
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
