import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"

const abi = B3TRGovernor__factory.abi
const address = getConfig().b3trGovernorAddress
const method = "proposalDeadline" as const

export const getProposalDeadlineQueryKey = (proposalId: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
  })

/**
 *  Hook to get the voteEnd block of the given proposal
 * @param proposalId  the id of the proposal
 * @returns  the voteEnd block of the given proposal
 */
export const useProposalDeadline = (proposalId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
    queryOptions: {
      select: data => data[0].toString(),
    },
  })
}
