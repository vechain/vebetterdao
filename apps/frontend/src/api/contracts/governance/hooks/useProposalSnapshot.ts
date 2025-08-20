import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"

const abi = B3TRGovernor__factory.abi
const address = getConfig().b3trGovernorAddress
const method = "proposalSnapshot" as const

export const getProposalSnapshotQueryKey = (proposalId: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
  })

/**
 *  Hook to get the voteStart snapshot of the given proposal
 * @param proposalId  the id of the proposal
 * @returns  the voteStart snapshot of the given proposal
 */
export const useProposalSnapshot = (proposalId: string) => {
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
