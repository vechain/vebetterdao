import { useCurrentBlock } from "@/api/blockchain"
import { useConnex } from "@vechain/dapp-kit-react"
import { useProposalsEvents } from "./useProposalsEvents"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getProposalDeadline, getProposalDeadlineQueryKey } from "./useProposalDeadline"

const getPastProposalsQueryKey = () => ["proposals", "past"]
/**
 *  Hook to get the past proposals using on-chain events (i.e the proposals expired, canceled, queued or executed)
 * @returns  the past proposals events (i.e the proposals expired, canceled, queued or executed)
 */
export const usePastProposals = () => {
  const queryClient = useQueryClient()
  const { thor } = useConnex()
  const { data: currentBlock } = useCurrentBlock()
  const { data: proposalsEvents } = useProposalsEvents()

  return useQuery({
    queryKey: getPastProposalsQueryKey(),
    queryFn: async () => {
      if (!thor || !proposalsEvents) return
      const lastBlock = currentBlock?.number ?? thor.status.head.number

      const filteredProposals = []

      for (const proposal of proposalsEvents.created) {
        if (
          proposalsEvents.canceled.some(canceledProposal => canceledProposal.proposalId === proposal.proposalId) ||
          proposalsEvents.executed.some(executedProposal => executedProposal.proposalId === proposal.proposalId) ||
          proposalsEvents.queued.some(queuedProposal => queuedProposal.proposalId === proposal.proposalId)
        ) {
          filteredProposals.push(proposal)
        }

        const proposalVoteEnd = await queryClient.ensureQueryData({
          queryKey: getProposalDeadlineQueryKey(proposal.proposalId),
          queryFn: () => getProposalDeadline(thor, proposal.proposalId),
        })

        if (Number(proposalVoteEnd) < lastBlock) {
          filteredProposals.push(proposal)
        }
      }

      return filteredProposals
    },
    enabled: !!thor && !!proposalsEvents,
  })
}
