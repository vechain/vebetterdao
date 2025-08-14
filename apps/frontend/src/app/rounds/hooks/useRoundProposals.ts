import { useCurrentAllocationsRoundId, useAllocationsRound } from "@/api"
import { useFilteredProposals } from "@/app/proposals/hooks/useFilteredProposals"
import { ProposalFilter } from "@/store"
import { useMemo } from "react"
import { ProposalState } from "@/hooks/proposals/grants/types"

export const useRoundProposals = (roundId: string) => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  const currentRoundIdProposals = useFilteredProposals([ProposalFilter.InThisRound, ProposalFilter.LookingForSupport])

  const otherProposals = useMemo(() => {
    if (roundId === currentRoundId) return []
    return currentRoundIdProposals.allProposals.filter(
      proposal => proposal.votingRoundId === roundId && proposal.state !== ProposalState.Canceled,
    )
  }, [currentRoundIdProposals, roundId, currentRoundId])

  const { data: allocationRound, isLoading: allocationRoundLoading } = useAllocationsRound(roundId)

  const proposalsToRender = useMemo(() => {
    const proposals = []
    if (allocationRound?.roundId === currentRoundId) {
      proposals.push(...currentRoundIdProposals.filteredProposals)
    }
    proposals.push(...otherProposals)
    return proposals
  }, [allocationRound, currentRoundIdProposals, otherProposals, currentRoundId])

  return {
    allocationRound,
    proposalsToRender,
    roundLoading: allocationRoundLoading,
  }
}
