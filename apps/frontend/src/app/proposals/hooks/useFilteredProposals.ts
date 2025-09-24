import { useAllProposalsDepositReached } from "@/api"
import { GrantProposalEnriched, ProposalEnriched, ProposalState } from "@/hooks/proposals/grants/types"
import { ProposalFilter, StateFilter } from "@/store"
import { useCallback, useMemo } from "react"

/**
 * Reacting to the changes in the useFiltersProposals store, this hook returns the filtered proposals.
 */
export const useFilteredProposals = (
  selectedFilter?: (ProposalFilter | StateFilter)[],
  proposals?: ProposalEnriched[] | GrantProposalEnriched[],
) => {
  type ProposalWithStateAndDeposit = (ProposalEnriched | GrantProposalEnriched) & { isDepositReached?: boolean }

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

  const filteredProposals: ProposalWithStateAndDeposit[] = useMemo(() => {
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
      [StateFilter.InDevelopment]: proposal.state === ProposalState.InDevelopment,
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

  const sortByPhase = useCallback((proposals: ProposalWithStateAndDeposit[]) => {
    const stateOrder = [
      //1 - Approval Phase
      ProposalState.Succeeded,
      ProposalState.Active,
      //2 - Support Phase
      ProposalState.Pending,
      //3 - In Development
      ProposalState.InDevelopment,
      ProposalState.Queued,
      //4 - Completed/executed
      ProposalState.Completed,
      ProposalState.Executed,
      //5 - Canceled/Defeated/Deposit Not Met
      ProposalState.Canceled,
      ProposalState.Defeated,
      ProposalState.DepositNotMet,
    ]
    return proposals.sort((a: ProposalWithStateAndDeposit, b: ProposalWithStateAndDeposit) => {
      // First, sort by phase (state order)
      const phaseComparison = stateOrder.indexOf(a.state) - stateOrder.indexOf(b.state)

      // If they're in the same phase, sort by newest to oldest (createdAt descending)
      if (phaseComparison === 0) {
        return (b.createdAt || 0) - (a.createdAt || 0)
      }

      return phaseComparison
    })
  }, [])

  const sortedFilteredProposals: ProposalWithStateAndDeposit[] = useMemo(() => {
    if (!filteredProposals?.length) return []
    return sortByPhase(filteredProposals)
  }, [filteredProposals, sortByPhase])

  return {
    filteredProposals: sortedFilteredProposals,
    isLoading: allProposalsDepositReachedLoading,
    allProposals: proposalsWithStateAndDeposit ?? [],
  }
}
