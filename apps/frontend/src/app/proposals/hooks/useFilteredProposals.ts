import { ProposalState, useAllProposalsState, useProposalsEvents } from "@/api"
import { useProposalFilters } from "@/store"
import { useCallback, useMemo } from "react"
import { StateFilter } from "../components"

/**
 * Reacting to the changes in the useFiltersProposals store, this hook returns the filtered proposals.
 */
export const useFilteredProposals = () => {
  const { data: proposalsEvents, isLoading: proposalsEventsLoading } = useProposalsEvents()
  const { data: allProposalsState } = useAllProposalsState()
  const { selectedFilter } = useProposalFilters()

  const checkProposalState = useCallback(
    (proposalIndex: number, state: number) => {
      if (!allProposalsState) return false
      return allProposalsState[proposalIndex]?.state === state
    },
    [allProposalsState],
  )

  const filteredProposals = useMemo(() => {
    console.log("filter", selectedFilter)
    if (!proposalsEvents) return []

    switch (selectedFilter) {
      case StateFilter.Active:
        return proposalsEvents.created.filter((_proposal, index) => checkProposalState(index, ProposalState.Active))
      case StateFilter.Canceled:
        return proposalsEvents.created.filter((_proposal, index) => checkProposalState(index, ProposalState.Canceled))
      case StateFilter.Succeeded:
        return proposalsEvents.created.filter((_proposal, index) => checkProposalState(index, ProposalState.Succeeded))
      case StateFilter.Defeated:
        return proposalsEvents.created.filter((_proposal, index) => checkProposalState(index, ProposalState.Defeated))
      case StateFilter.DepositNotMet:
        return proposalsEvents.created.filter((_proposal, index) =>
          checkProposalState(index, ProposalState.DepositNotMet),
        )
      case StateFilter.Queued:
        return proposalsEvents.created.filter((_proposal, index) => checkProposalState(index, ProposalState.Queued))
      case StateFilter.Executed:
        return proposalsEvents.created.filter((_proposal, index) => checkProposalState(index, ProposalState.Executed))

      default:
        return proposalsEvents.created
    }
  }, [proposalsEvents, selectedFilter, checkProposalState])

  const allProposals = useMemo(() => {
    if (!filteredProposals) return []

    const sortedProposals = filteredProposals.sort((a, b) => {
      // sort first by roundId, then by timestamp
      const aRoundID = Number(a.roundIdVoteStart)
      const bRoundID = Number(b.roundIdVoteStart)
      if (aRoundID !== bRoundID) return bRoundID - aRoundID
      return b.blockMeta.blockTimestamp - a.blockMeta.blockTimestamp
    })

    return sortedProposals
  }, [filteredProposals])

  const isLoading = useMemo(() => {
    return proposalsEventsLoading
  }, [proposalsEventsLoading])

  return { filteredProposals: allProposals, isLoading, allProposals: proposalsEvents?.created ?? [] }
}
