import { ProposalState, useAllProposalsState, useProposalsEvents, useAllProposalsDepositReached } from "@/api"
import { useMemo } from "react"
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

  const proposalsWithStateAndDeposit = useMemo(() => {
    if (!proposalsEvents) return []

    return proposalsEvents.created.map(proposal => ({
      ...proposal,
      state: allProposalsState?.find(proposalState => proposalState.proposalId === proposal.proposalId)?.state,
      isDepositReached: allProposalsDepositReached?.find(
        proposalDepositReached => proposalDepositReached.proposalId === proposal.proposalId,
      )?.depositReached,
    }))
  }, [proposalsEvents, allProposalsState, allProposalsDepositReached])

  const filteredProposals = useMemo(() => {
    if (!proposalsWithStateAndDeposit) return []
    if (!selectedFilter || selectedFilter.length === 0) return proposalsWithStateAndDeposit

    const proposals: typeof proposalsWithStateAndDeposit = []

    for (const filter of selectedFilter) {
      proposals.push(
        ...proposalsWithStateAndDeposit.filter(proposal => {
          switch (filter) {
            case ProposalFilter.InThisRound:
              return proposal.state === ProposalState.Active
            case StateFilter.Canceled:
              return proposal.state === ProposalState.Canceled
            case StateFilter.Succeeded:
              return proposal.state === ProposalState.Succeeded
            case StateFilter.Defeated:
              return proposal.state === ProposalState.Defeated
            case StateFilter.DepositNotMet:
              return proposal.state === ProposalState.DepositNotMet
            case StateFilter.Queued:
              return proposal.state === ProposalState.Queued
            case StateFilter.Executed:
              return proposal.state === ProposalState.Executed
            case ProposalFilter.LookingForSupport:
              return proposal.state === ProposalState.Pending && !proposal.isDepositReached
            case ProposalFilter.UpcomingVoting:
              return proposal.state === ProposalState.Pending && proposal.isDepositReached

            default:
              return false
          }
        }),
      )
    }
    return proposals
  }, [selectedFilter, proposalsWithStateAndDeposit])

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

  return {
    filteredProposals: sortedFilteredProposals,
    isLoading,
    allProposals: proposalsEvents?.created ?? [],
  }
}
