import { ProposalState, useAllProposalsState, useProposalsEvents, useAllProposalsDepositReached } from "@/api"
import { useCallback, useMemo } from "react"
import { ProposalFilter, StateFilter } from "../components"

/**
 * Reacting to the changes in the useFiltersProposals store, this hook returns the filtered proposals.
 */
export const useFilteredProposals = (selectedFilter?: (ProposalFilter | StateFilter)[]) => {
  const { data: proposalsEvents, isLoading: proposalsEventsLoading } = useProposalsEvents()

  const proposalsIds = useMemo(() => {
    if (!proposalsEvents?.created) return []
    return proposalsEvents?.created.map(proposal => proposal.proposalId)
  }, [proposalsEvents])

  const { data: allProposalsState, isLoading: allProposalsStateLoading } = useAllProposalsState(proposalsIds)
  const { data: allProposalsDepositReached, isLoading: allProposalsDepositReachedLoading } =
    useAllProposalsDepositReached(proposalsIds)

  const checkProposalState = useCallback(
    (proposalIndex: number, state: number) => {
      if (!allProposalsState) return false
      return allProposalsState[proposalIndex]?.state === state
    },
    [allProposalsState],
  )

  const filteredProposals = useMemo(() => {
    if (!proposalsEvents) return []

    if (!selectedFilter || selectedFilter.length === 0) return proposalsEvents.created

    const proposals = []

    for (const filter of selectedFilter) {
      proposals.push(
        ...proposalsEvents.created.filter((_proposal, index) => {
          switch (filter) {
            case ProposalFilter.InThisRound:
              return checkProposalState(index, ProposalState.Active)
            case StateFilter.Active:
              return checkProposalState(index, ProposalState.Active)
            case StateFilter.Canceled:
              return checkProposalState(index, ProposalState.Canceled)
            case StateFilter.Succeeded:
              return checkProposalState(index, ProposalState.Succeeded)
            case StateFilter.Defeated:
              return checkProposalState(index, ProposalState.Defeated)
            case StateFilter.DepositNotMet:
              return checkProposalState(index, ProposalState.DepositNotMet)
            case StateFilter.Queued:
              return checkProposalState(index, ProposalState.Queued)
            case StateFilter.Executed:
              return checkProposalState(index, ProposalState.Executed)
            case ProposalFilter.LookingForSupport:
              return (
                checkProposalState(index, ProposalState.Pending) && !allProposalsDepositReached?.[index]?.depositReached
              )
            case ProposalFilter.UpcomingVoting:
              return (
                checkProposalState(index, ProposalState.Pending) && allProposalsDepositReached?.[index]?.depositReached
              )
            default:
              return true
          }
        }),
      )
    }
    return proposals
  }, [proposalsEvents, selectedFilter, checkProposalState, allProposalsDepositReached])

  const sortedFilteredProposals = useMemo(() => {
    if (!filteredProposals) return []

    const sortedProposals = [...filteredProposals].sort((a, b) => {
      // sort first by roundId, then by timestamp
      const aRoundID = Number(a.roundIdVoteStart)
      const bRoundID = Number(b.roundIdVoteStart)
      if (aRoundID !== bRoundID) return bRoundID - aRoundID
      return b.blockMeta.blockTimestamp - a.blockMeta.blockTimestamp
    })

    return sortedProposals
  }, [filteredProposals])

  const isLoading = useMemo(() => {
    return proposalsEventsLoading || allProposalsStateLoading || allProposalsDepositReachedLoading
  }, [proposalsEventsLoading, allProposalsStateLoading, allProposalsDepositReachedLoading])

  return { filteredProposals: sortedFilteredProposals, isLoading, allProposals: proposalsEvents?.created ?? [] }
}
