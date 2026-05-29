import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useCallClause, getCallClauseQueryKey, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi
const method = "isProposalPaid" as const

export const getIsProposalPaidQueryKey = (proposalId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(proposalId)] })

/** Prefix key for bulk invalidation across all proposalIds. */
export const getIsProposalPaidQueryKeyPrefix = () => getCallClauseQueryKey({ abi, address, method })

/**
 * Hook to check whether the V11 payout has been pulled from Treasury for the given proposal.
 */
export const useIsProposalPaid = (proposalId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
    queryOptions: {
      enabled: !!proposalId,
      select: data => data[0] as boolean,
    },
  })
}
