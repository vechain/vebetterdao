import { useProposalsEvents } from "./useProposalsEvents"

export const useProposalCreatedEvent = (proposalId: string) => {
  const events = useProposalsEvents()
  return {
    data: events.data?.created.find(event => event.proposalId === proposalId),
    isLoading: events.isLoading,
    error: events.error,
  }
}
