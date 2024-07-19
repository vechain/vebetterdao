import { useProposalsEvents } from "@/api"
import { useProposalFilters } from "@/store"
import { useMemo } from "react"
import { StateFilter } from "../components"

/**
 * Reacting to the changes in the useFiltersProposals store, this hook returns the filtered proposals.
 */
export const useFilteredProposals = () => {
  const { data: proposalsEvents, isLoading: proposalsEventsLoading } = useProposalsEvents()
  const { selectedFilter } = useProposalFilters()

  const filteredProposals = useMemo(() => {
    console.log("filter", selectedFilter)
    if (!proposalsEvents) return []

    switch (selectedFilter) {
      // case StateFilter.Active:
      //     return proposalsEvents.
      case StateFilter.Canceled:
        return proposalsEvents.created.filter(proposal =>
          proposalsEvents.canceled.some(canceledProposal => canceledProposal.proposalId === proposal.proposalId),
        )
      // case StateFilter.Defeated:
      //     return proposalsEvents.defeated
      // case StateFilter.DepositNotMet:
      //     return proposalsEvents.succeeded
      case StateFilter.Queued:
        return proposalsEvents.created.filter(proposal =>
          proposalsEvents.queued.some(queuedProposal => queuedProposal.proposalId === proposal.proposalId),
        )
      case StateFilter.Executed:
        return proposalsEvents.created.filter(proposal =>
          proposalsEvents.executed.some(executedProposal => executedProposal.proposalId === proposal.proposalId),
        )
      //   case StateFilter.Succeeded:
      //       return proposalsEvents.depositNotMet
      default:
        return proposalsEvents.created
    }
  }, [proposalsEvents, selectedFilter])

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

  return { proposals: allProposals, isLoading }
}
