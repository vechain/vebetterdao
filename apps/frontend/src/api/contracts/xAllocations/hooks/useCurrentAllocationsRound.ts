import { useMemo } from "react"
import { useCurrentAllocationsRoundId } from "./useCurrentAllocationsRoundId"
import { useAllocationsRoundState } from "./useAllocationsRoundState"
import { AllocationProposalCreated, useAllocationsRoundsEvents } from "./useAllocationsRoundsEvents"

export type AllocationRoundWithState = AllocationProposalCreated & {
  state?: string
}

/**
 *  Hook to get the current allocation round info and state using currentRoundId, state and onchain events
 * @returns the current allocation round info and state
 */
export const useCurrentAllocationsRound = () => {
  const currentAllocationId = useCurrentAllocationsRoundId()
  const currentAllocationState = useAllocationsRoundState(currentAllocationId.data)

  const allocationRoundsEvents = useAllocationsRoundsEvents()

  const currentAllocationRound: AllocationRoundWithState | undefined = useMemo(() => {
    if (!currentAllocationId.data || !allocationRoundsEvents.data) return
    const roundInfo = allocationRoundsEvents.data.created.find(
      allocationRound => allocationRound.proposalId === currentAllocationId.data,
    )
    if (!roundInfo) return
    return {
      ...roundInfo,
      state: currentAllocationState.data,
    }
  }, [currentAllocationId, allocationRoundsEvents, currentAllocationState])

  const isLoading =
    currentAllocationId.isLoading || allocationRoundsEvents.isLoading || currentAllocationState.isLoading
  const isError = currentAllocationId.isError || allocationRoundsEvents.isError || currentAllocationState.isError
  const error = currentAllocationId.error || allocationRoundsEvents.error || currentAllocationState.error

  return {
    ...allocationRoundsEvents,
    data: currentAllocationRound,
    isLoading,
    isError,
    error,
  }
}
