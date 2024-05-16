import { useMemo } from "react"
import { useProposalsEvents } from "./useProposalsEvents"

export const useProposalCreatedEvent = (proposalId: string) => {
  const events = useProposalsEvents()

  const proposalCreatedEvent = useMemo(
    () => ({
      data: events.data?.created.find(event => event.proposalId === proposalId),
      isLoading: events.isLoading,
      error: events.error,
    }),
    [events],
  )
  return proposalCreatedEvent
}
