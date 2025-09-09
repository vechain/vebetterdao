import { useAllProposalsDepositReached } from "@/api"
import { useMemo } from "react"
import { ProposalFilter, StateFilter } from "@/store"

import { ProposalState, GrantProposalEnriched, ProposalEnriched } from "@/hooks/proposals/grants/types"

/**
 * Reacting to the changes in the useFiltersProposals store, this hook returns the filtered proposals.
 */
export const useFilteredProposals = (
  selectedFilter?: (ProposalFilter | StateFilter)[],
  proposals?: ProposalEnriched[] | GrantProposalEnriched[],
) => {
  const proposalsIds = useMemo(() => {
    return proposals?.map(proposal => proposal.id) || []
  }, [proposals])

  const { data: allProposalsDepositReached, isLoading: allProposalsDepositReachedLoading } =
    useAllProposalsDepositReached(proposalsIds)

  const proposalsWithStateAndDeposit = useMemo(() => {
    if (!proposals?.length) return []

    return proposals.map(proposal => ({
      ...proposal,
      isDepositReached: allProposalsDepositReached?.find(
        proposalDepositReached => proposalDepositReached.proposalId === proposal.id,
      )?.depositReached,
    }))
  }, [proposals, allProposalsDepositReached])

  const filteredProposals = useMemo(() => {
    if (!proposalsWithStateAndDeposit?.length) return []
    if (!selectedFilter || selectedFilter.length === 0) return proposalsWithStateAndDeposit

    // Create filter condition mapping
    const getFilterCondition = (
      proposal: (typeof proposalsWithStateAndDeposit)[0],
    ): Record<ProposalFilter | StateFilter, boolean> => ({
      // ProposalFilter values
      [ProposalFilter.State]: false, // Meta filter, not used for direct matching
      [ProposalFilter.InThisRound]: proposal.state === ProposalState.Active,
      [ProposalFilter.LookingForSupport]: proposal.state === ProposalState.Pending && !proposal.isDepositReached,
      [ProposalFilter.UpcomingVoting]: proposal.state === ProposalState.Pending && !!proposal.isDepositReached,
      // StateFilter values
      [StateFilter.Canceled]: proposal.state === ProposalState.Canceled,
      [StateFilter.Defeated]: proposal.state === ProposalState.Defeated,
      [StateFilter.Succeeded]: proposal.state === ProposalState.Succeeded,
      [StateFilter.Queued]: proposal.state === ProposalState.Queued,
      [StateFilter.Executed]: proposal.state === ProposalState.Executed,
      [StateFilter.DepositNotMet]: proposal.state === ProposalState.DepositNotMet,
      //Same as executed, otherwise it would go to either cancel of completed depending on the milestones
      [StateFilter.InDevelopment]: proposal.state === ProposalState.Executed,
      [StateFilter.Completed]: proposal.state === ProposalState.Completed,
      [StateFilter.Pending]: proposal.state === ProposalState.Pending,
      [StateFilter.Active]: proposal.state === ProposalState.Active,
    })

    // Check if proposal matches any active filter
    const matchesAnyFilter = (proposal: (typeof proposalsWithStateAndDeposit)[0]): boolean => {
      const conditions = getFilterCondition(proposal)
      return selectedFilter.some(filter => conditions[filter])
    }

    // Single pass filter - O(n) instead of O(n*m) where m is number of filters
    return proposalsWithStateAndDeposit.filter(matchesAnyFilter)
  }, [selectedFilter, proposalsWithStateAndDeposit])

  const sortedFilteredProposals = useMemo(() => {
    if (!filteredProposals?.length) return []

    const sortedProposals = [...filteredProposals].sort((a, b) => {
      // sort first by roundId, then by timestamp
      const aRoundID = Number(a.votingRoundId)
      const bRoundID = Number(b.votingRoundId)
      if (aRoundID !== bRoundID) return bRoundID - aRoundID
      return b.createdAt - a.createdAt
    })

    return sortedProposals
  }, [filteredProposals])

  return {
    filteredProposals: sortedFilteredProposals,
    isLoading: allProposalsDepositReachedLoading,
    allProposals: proposalsWithStateAndDeposit ?? [],
  }
}
