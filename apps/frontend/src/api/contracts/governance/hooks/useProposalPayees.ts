import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi
const method = "getProposalPayees" as const

export type ProposalPayee = {
  account: string
  amount: bigint
}

/**
 * Returns the query key for fetching the V11 registered payees of a proposal.
 */
export const getProposalPayeesQueryKey = (proposalId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(proposalId)] })

/**
 * Hook to fetch the registered developer payees for a proposal.
 * Returns an empty array for proposals that haven't gone through
 * markAsInDevelopmentWithPayees yet.
 */
export const useProposalPayees = (proposalId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
    queryOptions: {
      enabled: !!proposalId,
      select: data => {
        const raw = data[0] as readonly { account: string; amount: bigint }[]
        return raw.map<ProposalPayee>(p => ({ account: p.account, amount: p.amount }))
      },
    },
  })
}
