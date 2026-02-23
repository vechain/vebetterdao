import { useMemo } from "react"

import { useFilteredProposals } from "@/app/proposals/hooks/useFilteredProposals"
import { ProposalState } from "@/hooks/proposals/grants/types"

import { useAllocationsRound } from "../../../api/contracts/xAllocations/hooks/useAllocationsRound"
import { useCurrentAllocationsRoundId } from "../../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useProposalEnriched } from "../../../hooks/proposals/common/useProposalEnriched"
import { ProposalFilter } from "../../../store/useProposalFilters"

export const useRoundProposals = (roundId: string) => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: { enrichedProposals } = { enrichedProposals: [] }, isLoading: isProposalsLoading } =
    useProposalEnriched()
  const { isLoading: isFilteredLoading, ...currentRoundIdProposals } = useFilteredProposals(
    [ProposalFilter.InThisRound, ProposalFilter.LookingForSupport, ProposalFilter.UpcomingVoting],
    enrichedProposals,
  )
  const otherProposals = useMemo(() => {
    if (roundId === currentRoundId) return []
    return currentRoundIdProposals.allProposals.filter(
      proposal => proposal.votingRoundId === roundId && proposal.state !== ProposalState.Canceled,
    )
  }, [currentRoundIdProposals, roundId, currentRoundId])
  const { data: allocationRound, isLoading: allocationRoundLoading } = useAllocationsRound(roundId)
  const proposalsToRender = useMemo(() => {
    if (allocationRoundLoading) return []
    const proposals = []
    if (allocationRound?.roundId === currentRoundId) {
      proposals.push(...currentRoundIdProposals.filteredProposals)
    }
    proposals.push(...otherProposals)
    return proposals
  }, [
    allocationRoundLoading,
    allocationRound?.roundId,
    currentRoundId,
    otherProposals,
    currentRoundIdProposals.filteredProposals,
  ])
  return {
    allocationRound,
    proposalsToRender,
    roundLoading: allocationRoundLoading,
    proposalsLoading: isProposalsLoading || isFilteredLoading || allocationRoundLoading,
  }
}
