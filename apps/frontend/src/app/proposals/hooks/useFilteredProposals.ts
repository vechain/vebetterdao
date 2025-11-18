import { useCallback, useMemo } from "react"

import { GrantProposalEnriched, ProposalEnriched, ProposalState } from "@/hooks/proposals/grants/types"
import { ProposalFilter, StateFilter } from "@/store/useProposalFilters"

import { useAllProposalsDepositReached } from "../../../api/contracts/governance/hooks/useAllProposalsDepositReached"

/**
 * Reacting to the changes in the useFiltersProposals store, this hook returns the filtered proposals.
 */
export const useFilteredProposals = (
  selectedFilter?: (ProposalFilter | StateFilter)[],
  proposals?: ProposalEnriched[] | GrantProposalEnriched[],
  defaultFilters?: (ProposalFilter | StateFilter)[],
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

    // Use default filter if no filter is selected
    const activeFilter = !selectedFilter || selectedFilter?.length === 0 ? defaultFilters : selectedFilter

    if (!activeFilter || activeFilter?.length === 0) return proposalsWithStateAndDeposit

    // Create filter condition mapping
    const getFilterCondition = (
      proposal: (typeof proposalsWithStateAndDeposit)[0],
    ): Record<ProposalFilter | StateFilter, boolean> => ({
      // ProposalFilter values
      [ProposalFilter.State]: false, // Meta filter, not used for direct matching
      [ProposalFilter.InThisRound]: proposal.state === ProposalState.Active,
      [ProposalFilter.LookingForSupport]: proposal.state === ProposalState.Pending && !proposal.isDepositReached,
      [ProposalFilter.UpcomingVoting]: proposal.state === ProposalState.Pending && !!proposal.isDepositReached,
      [ProposalFilter.ApprovalPhase]:
        proposal.state === ProposalState.Active || proposal.state === ProposalState.Succeeded,
      [ProposalFilter.SupportPhase]: proposal.state === ProposalState.Pending,
      [ProposalFilter.FailedStates]:
        proposal.state === ProposalState.Canceled ||
        proposal.state === ProposalState.Defeated ||
        proposal.state === ProposalState.DepositNotMet,
      [ProposalFilter.StandardInDevelopment]:
        proposal.state === ProposalState.InDevelopment ||
        proposal.state === ProposalState.Queued ||
        proposal.state === ProposalState.Executed,
      [ProposalFilter.InDevelopment]:
        proposal.state === ProposalState.InDevelopment || proposal.state === ProposalState.Queued,
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
      return activeFilter.some(filter => conditions[filter])
    }

    // Single pass filter - O(n) instead of O(n*m) where m is number of filters
    return proposalsWithStateAndDeposit.filter(matchesAnyFilter)
  }, [selectedFilter, proposalsWithStateAndDeposit, defaultFilters])

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
      //5 - Failed states: Defeated/Deposit Not Met/Canceled (grouped together)
    ]

    const failedStates = [ProposalState.Defeated, ProposalState.DepositNotMet, ProposalState.Canceled]
    const failedStatesPhaseIndex = stateOrder.length

    const getPhaseIndex = (state: ProposalState) => {
      if (failedStates.includes(state)) {
        return failedStatesPhaseIndex
      }
      return stateOrder.indexOf(state)
    }

    return [...proposals].sort((a: ProposalWithStateAndDeposit, b: ProposalWithStateAndDeposit) => {
      // First, sort by phase (state order)
      const phaseComparison = getPhaseIndex(a.state) - getPhaseIndex(b.state)

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
