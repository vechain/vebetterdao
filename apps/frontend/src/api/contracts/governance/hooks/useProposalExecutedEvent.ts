import { useMemo } from "react"
import { useProposalsEvents } from "./useProposalsEvents"

/**
 * Hook to get the executed event of a proposal
 * @param proposalId  the proposal id to get the executed event for
 * @returns the executed event of the proposal
 */
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
