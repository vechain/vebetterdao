import { useMemo } from "react"
import { useProposalsEvents } from "./useProposalsEvents"

/**
 * Hook to get the queued event for a proposal
 * @param proposalId  the proposal id to get the queued event for
 * @returns the queued event for the proposal
 */
export const useProposalQueuedEvent = (proposalId: string) => {
  const events = useProposalsEvents()

  const proposalQueuedEvent = useMemo(
    () => ({
      data: events.data?.queued.find(event => event.proposalId === proposalId),
      isLoading: events.isLoading,
      error: events.error,
    }),
    [events, proposalId],
  )
  return proposalQueuedEvent
}
