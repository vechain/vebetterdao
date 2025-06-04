import { useQuery } from "@tanstack/react-query"
import { useCurrentBlock, useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

const governorInterface = B3TRGovernor__factory.createInterface()

/**
 *  Get the voteStart snapshot of the given proposal
 * @param thor  the thor client
 * @param proposalId  the id of the proposal
 * @returns  the voteStart snapshot of the given proposal
 */
export const getProposalSnapshot = async (thor: ThorClient, proposalId: string): Promise<string | number> => {
  const functionFragment = governorInterface.getFunction("proposalSnapshot").format("json")
  const res = await thor.contracts
    .load(GOVERNANCE_CONTRACT, B3TRGovernor__factory.abi)
    .read.proposalSnapshot(JSON.parse(functionFragment), proposalId)

  if (!res) return Promise.reject(new Error("Proposal snapshot not found"))

  return res[0].toString()
}

export const getProposalSnapshotQueryKey = (proposalId: string) => ["proposals", proposalId, "snapshot"]

/**
 *  Hook to get the voteStart snapshot of the given proposal
 * @param proposalId  the id of the proposal
 * @returns  the voteStart snapshot of the given proposal
 */
export const useProposalSnapshot = (proposalId: string) => {
  const thor = useThor()
  const { data: currentBlock } = useCurrentBlock()

  return useQuery({
    queryKey: getProposalSnapshotQueryKey(proposalId),
    queryFn: async () => await getProposalSnapshot(thor, proposalId),
    enabled: !!thor && !!currentBlock && currentBlock.number > 0,
  })
}
