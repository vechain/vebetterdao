import { useMemo } from "react"
import { useProposalsEvents } from "./useProposalsEvents"

/**
 * Hook to get the canceled event of a proposal
 * @param proposalId  the proposal id to get the canceled event for
 * @returns the canceled event of the proposal
 */
export const useProposalCanceledEvent = (proposalId: string) => {
  const events = useProposalsEvents()

  const proposalExecutedEvent = useMemo(
    () => ({
      data: events.data?.canceled.find(event => event.proposalId === proposalId),
      isLoading: events.isLoading,
      error: events.error,
    }),
    [events, proposalId],
  )
  return proposalExecutedEvent
}
