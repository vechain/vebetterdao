import { useThor, useCurrentBlock } from "@vechain/vechain-kit"
import { useProposalsEvents } from "./useProposalsEvents"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getProposalSnapshot, getProposalSnapshotQueryKey } from "./useProposalSnapshot"

export const getIncomingProposalsQueryKey = () => ["proposals", "incoming"]
/**
 *  Hook to get the incoming proposals using on-chain events (i.e the proposals not started yet and not canceled)
 * @returns  the incoming proposals events (i.e the proposals not started yet and not canceled)
 */
export const useIncomingProposals = () => {
  const queryClient = useQueryClient()
  const thor = useThor()
  const { data: currentBlock } = useCurrentBlock()
  const { data: proposalsEvents } = useProposalsEvents()

  return useQuery({
    queryKey: getIncomingProposalsQueryKey(),
    queryFn: async () => {
      if (!thor || !proposalsEvents) return
      const lastBlock = currentBlock?.number ?? (await thor.blocks.getBestBlockCompressed())?.number ?? 0
      const filteredProposals = []
      for (const proposal of proposalsEvents.created) {
        const voteStart = await queryClient.ensureQueryData({
          queryKey: getProposalSnapshotQueryKey(proposal.proposalId),
          queryFn: () => getProposalSnapshot(thor, proposal.proposalId),
        })
        const isCanceled = proposalsEvents.canceled.some(
          canceledProposal => canceledProposal.proposalId === proposal.proposalId,
        )
        if (Number(voteStart) >= lastBlock && !isCanceled) {
          filteredProposals.push(proposal)
        }
      }
      return filteredProposals
    },
    enabled: !!thor && !!proposalsEvents && !!currentBlock && currentBlock.number > 0,
  })
}
