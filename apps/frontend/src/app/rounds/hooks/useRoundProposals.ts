import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useFilteredProposals } from "@/app/proposals/hooks/useFilteredProposals"
import { getProposalsAndGrants } from "@/app/proposals/page"
import { ProposalState } from "@/hooks/proposals/grants/types"

import { useAllocationsRound } from "../../../api/contracts/xAllocations/hooks/useAllocationsRound"
import { useCurrentAllocationsRoundId } from "../../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { ProposalFilter } from "../../../store/useProposalFilters"

export const useGetProposalsAndGrants = () => {
  const thor = useThor()
  return useQuery({ queryKey: ["getProposalsAndGrants"], queryFn: () => getProposalsAndGrants(thor) })
}

export const useRoundProposals = (roundId: string) => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data } = useGetProposalsAndGrants()
  const currentRoundIdProposals = useFilteredProposals(
    [ProposalFilter.InThisRound, ProposalFilter.LookingForSupport],
    data?.proposals,
  )
  const otherProposals = useMemo(() => {
    if (roundId === currentRoundId) return []
    return currentRoundIdProposals.allProposals.filter(
      // TODO: fix
      proposal => proposal.blockID === roundId && proposal.state !== ProposalState.Canceled,
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
  }
}
