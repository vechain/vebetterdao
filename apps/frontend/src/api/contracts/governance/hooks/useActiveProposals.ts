import { useCurrentBlock } from "@/api/blockchain"
import { useConnex } from "@vechain/dapp-kit-react"
import { useProposalsEvents } from "./useProposalsEvents"
import { useAllocationsRoundsEvents } from "../../xAllocations"
import { useQuery } from "@tanstack/react-query"

export const getActiveProposalsQueryKey = () => ["proposals", "active"]
/**
 *  Hook to get the active proposals events from the governor contract (i.e the proposals created, not canceled, expired and not queued/executed)
 * @returns  the active proposals events (i.e the proposals created, not canceled, expired and not queued/executed)
 */
export const useActiveProposals = () => {
  const { thor } = useConnex()
  const { data: currentBlock } = useCurrentBlock()
  const proposalsEventsQuery = useProposalsEvents()
  const allocationsEventsQuery = useAllocationsRoundsEvents()

  return useQuery({
    queryKey: getActiveProposalsQueryKey(),
    queryFn: async () => {
      const proposalsEvents = proposalsEventsQuery.data
      const createdAllocationsEvents = allocationsEventsQuery.data?.created
      if (!thor || !proposalsEvents) return
      const lastBlock = currentBlock?.number ?? thor.status.head.number
      return proposalsEvents.created.filter(proposal => {
        const relatedRound = createdAllocationsEvents?.find(
          round => Number(round.roundId) === Number(proposal.roundIdVoteStart),
        )
        return (
          Number(relatedRound?.voteStart) < lastBlock &&
          Number(relatedRound?.voteEnd) > lastBlock &&
          !proposalsEvents.canceled.some(canceledProposal => canceledProposal.proposalId === proposal.proposalId) &&
          !proposalsEvents.executed.some(executedProposal => executedProposal.proposalId === proposal.proposalId) &&
          !proposalsEvents.queued.some(queuedProposal => queuedProposal.proposalId === proposal.proposalId)
        )
      })
    },
    enabled: !!thor && !!thor.status.head.number && !!proposalsEventsQuery.data && !!allocationsEventsQuery.data,
  })
}
