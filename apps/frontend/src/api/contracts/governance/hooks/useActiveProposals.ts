import { useThor, useCurrentBlock } from "@vechain/vechain-kit"
import { useProposalsEvents } from "./useProposalsEvents"
import { useQuery } from "@tanstack/react-query"
import { queryClient } from "@/api/QueryProvider"
import { getProposalDeadlineQueryKey, getProposalDeadline } from "./useProposalDeadline"
import { getProposalSnapshotQueryKey, getProposalSnapshot } from "./useProposalSnapshot"

export const getActiveProposalsQueryKey = () => ["proposals", "active"]
/**
 *  Hook to get the active proposals events from the governor contract (i.e the proposals created, not canceled, expired and not queued/executed)
 * @returns  the active proposals events (i.e the proposals created, not canceled, expired and not queued/executed)
 */
export const useActiveProposals = () => {
  const thor = useThor()
  const { data: currentBlock } = useCurrentBlock()
  const proposalsEventsQuery = useProposalsEvents()

  const headNumber = thor.blocks.getHeadBlock()?.number

  return useQuery({
    queryKey: getActiveProposalsQueryKey(),
    queryFn: async () => {
      const proposalsEvents = proposalsEventsQuery.data
      if (!thor || !proposalsEvents) return
      const lastBlock = currentBlock?.number ?? (headNumber || 0)

      const filteredProposals = []
      for (const proposal of proposalsEvents.created) {
        const voteStart = await queryClient.ensureQueryData({
          queryKey: getProposalSnapshotQueryKey(proposal.proposalId),
          queryFn: () => getProposalSnapshot(thor, proposal.proposalId),
        })
        const voteEnd = await queryClient.ensureQueryData({
          queryKey: getProposalDeadlineQueryKey(proposal.proposalId),
          queryFn: () => getProposalDeadline(thor, proposal.proposalId),
        })
        const isCanceled = proposalsEvents.canceled.some(
          canceledProposal => canceledProposal.proposalId === proposal.proposalId,
        )
        const isExecuted = proposalsEvents.executed.some(
          executedProposal => executedProposal.proposalId === proposal.proposalId,
        )
        const isQueued = proposalsEvents.queued.some(
          queuedProposal => queuedProposal.proposalId === proposal.proposalId,
        )
        if (Number(voteStart) < lastBlock && Number(voteEnd) > lastBlock && !isCanceled && !isExecuted && !isQueued) {
          filteredProposals.push(proposal)
        }
      }

      return filteredProposals
    },
    enabled: !!thor && !!headNumber && !!proposalsEventsQuery.data,
  })
}
