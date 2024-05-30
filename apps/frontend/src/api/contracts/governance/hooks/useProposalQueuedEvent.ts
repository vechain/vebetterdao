import { useMemo } from "react"
import { useProposalsEvents } from "./useProposalsEvents"

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
