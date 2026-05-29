import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi
const method = "getProposalPayee" as const

export const getProposalPayeeQueryKey = (proposalId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(proposalId)] })

/**
 * Hook to fetch the single payout address registered for a proposal (V11).
 * Returns address(0) for proposals that haven't been moved to InDevelopment yet
 * or that were created with maxBudget == 0.
 */
export const useProposalPayee = (proposalId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
    queryOptions: {
      enabled: !!proposalId,
      select: data => data[0] as string,
    },
  })
}
