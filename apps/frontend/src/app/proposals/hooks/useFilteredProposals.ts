import { ProposalState, useAllProposalsState, useProposalsEvents, useAllProposalsDepositReached } from "@/api"
import { useCallback, useMemo } from "react"
import { ProposalFilter, StateFilter } from "@/store"

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
    (proposalId: string, state: number) => {
      if (!allProposalsState) return false
      const proposalWithState = allProposalsState.find(proposal => proposal.proposalId === proposalId)

      return proposalWithState?.state === state
    },
    [allProposalsState],
  )

  const filteredProposals = useMemo(() => {
    if (!proposalsEvents) return []

    if (!selectedFilter || selectedFilter.length === 0) return proposalsEvents.created

    const proposals = []

    for (const filter of selectedFilter) {
      proposals.push(
        ...proposalsEvents.created.filter((proposal, index) => {
          switch (filter) {
            case ProposalFilter.InThisRound:
              return checkProposalState(proposal.proposalId, ProposalState.Active)
            case StateFilter.Canceled:
              return checkProposalState(proposal.proposalId, ProposalState.Canceled)
            case StateFilter.Succeeded:
              return checkProposalState(proposal.proposalId, ProposalState.Succeeded)
            case StateFilter.Defeated:
              return checkProposalState(proposal.proposalId, ProposalState.Defeated)
            case StateFilter.DepositNotMet:
              return checkProposalState(proposal.proposalId, ProposalState.DepositNotMet)
            case StateFilter.Queued:
              return checkProposalState(proposal.proposalId, ProposalState.Queued)
            case StateFilter.Executed:
              return checkProposalState(proposal.proposalId, ProposalState.Executed)
            case ProposalFilter.LookingForSupport:
              return (
                checkProposalState(proposal.proposalId, ProposalState.Pending) &&
                !allProposalsDepositReached?.[index]?.depositReached
              )
            case ProposalFilter.UpcomingVoting:
              return (
                checkProposalState(proposal.proposalId, ProposalState.Pending) &&
                allProposalsDepositReached?.[index]?.depositReached
              )
            default:
              return false
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
