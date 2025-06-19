import { useCallClause, getCallClauseQueryKey, useThor } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"

const abi = B3TRGovernor__factory.abi
const address = getConfig().b3trGovernorAddress
const method = "proposalSnapshot" as const

export const getProposalSnapshotQueryKey = (proposalId: string) =>
  getCallClauseQueryKey<typeof abi>({
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
  const thor = useThor()
  const headBlock = thor.blocks.getHeadBlock() || { number: 0 }

  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
    queryOptions: {
      enabled: headBlock?.number > 0,
      select: data => data[0].toString(),
    },
  })
}
