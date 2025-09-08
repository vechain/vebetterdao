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

  const isLoading = useMemo(() => {
    return allProposalsDepositReachedLoading
  }, [allProposalsDepositReachedLoading])

  return {
    filteredProposals: sortedFilteredProposals,
    isLoading,
    allProposals: proposalsWithStateAndDeposit ?? [],
  }
}
