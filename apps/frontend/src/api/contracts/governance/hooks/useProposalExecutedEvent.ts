import { useMemo } from "react"
import { useProposalsEvents } from "./useProposalsEvents"

export const useProposalExecutedEvent = (proposalId: string) => {
  const events = useProposalsEvents()

  const proposalExecutedEvent = useMemo(
    () => ({
      data: events.data?.executed.find(event => event.proposalId === proposalId),
      isLoading: events.isLoading,
      error: events.error,
    }),
    [events, proposalId],
  )
  return proposalExecutedEvent
}
