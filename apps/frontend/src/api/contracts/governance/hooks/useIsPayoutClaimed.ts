import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useCallClause, getCallClauseQueryKey, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi
const method = "isPayoutClaimed" as const

/**
 * Returns the query key for fetching the claim status of a specific payee index.
 */
export const getIsPayoutClaimedQueryKey = (proposalId: string, payeeIndex: number) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(proposalId), BigInt(payeeIndex)] })

/**
 * Prefix query key matching every isPayoutClaimed query regardless of args — use for bulk
 * invalidation when we don't know which (proposalId, index) pairs are in the cache.
 */
export const getIsPayoutClaimedQueryKeyPrefix = () => getCallClauseQueryKey({ abi, address, method })

/**
 * Hook to check whether the payout at (proposalId, payeeIndex) has already
 * been pulled from Treasury.
 */
export const useIsPayoutClaimed = (proposalId: string, payeeIndex: number, enabled = true) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId), BigInt(payeeIndex)],
    queryOptions: {
      enabled: enabled && !!proposalId,
      select: data => data[0] as boolean,
    },
  })
}
