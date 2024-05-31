import { useMemo } from "react"
import { useProposalsEvents } from "./useProposalsEvents"

export const useProposalDepositEvent = (proposalId: string) => {
  const events = useProposalsEvents()

  const proposalDepositEvent = useMemo(() => {
    const supportingUsers = [
      ...new Set(
        events.data?.deposits.filter(deposit => deposit.proposalId === proposalId).map(deposit => deposit.depositor),
      ),
    ]
    return {
      supportingUsers,
      supportingUserCount: supportingUsers.length,
      data: events.data?.deposits,
      isLoading: events.isLoading,
      error: events.error,
    }
  }, [events.data?.deposits, events.error, events.isLoading, proposalId])
  return proposalDepositEvent
}
