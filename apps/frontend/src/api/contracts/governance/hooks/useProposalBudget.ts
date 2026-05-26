import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi
const method = "getProposalBudget" as const

/**
 * Returns the query key for fetching the V11 max B3TR budget of a proposal.
 */
export const getProposalBudgetQueryKey = (proposalId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(proposalId)] })

/**
 * Hook to fetch the maximum implementation budget (in B3TR wei) registered
 * for a proposal at creation time. Returns 0n for legacy proposals.
 */
export const useProposalBudget = (proposalId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
    queryOptions: {
      enabled: !!proposalId,
      select: data => data[0] as bigint,
    },
  })
}
