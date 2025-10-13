import { getConfig } from "@repo/config"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().grantsManagerContractAddress
const abi = GrantsManager__factory.abi
const method = "getMinimumMilestoneCount" as const
/**
 * Returns the query key to whether the milestone is minimum amount to create a grant proposal
 * @returns The query key for fetching the milestone claimable status.
 */
export const getMilestoneMinimumAmountQueryKey = () => getCallClauseQueryKeyWithArgs({ abi, address, method, args: [] })
/**
 * Hook to get the minimum milestone count to create a grant proposal
 * @returns number indicating if the milestone is minimum amount
 */
export const useMilestoneMinimumAmount = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: res => res[0],
    },
  })
}
