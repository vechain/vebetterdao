import { useMemo } from "react"
import { useProposalEnriched } from "./useProposalEnriched"
import { GrantProposalEnriched, ProposalEnriched, ProposalType } from "../grants/types"

export type UseProposalEnrichedByIdReturn = {
  proposal: GrantProposalEnriched | ProposalEnriched | undefined
  type: ProposalType
  isLoading: boolean
}

/**
 * Hook to return the enriched proposal and the ty[e of the proposal ] given a proposalId
 *
 * @param proposalId - The ID of the proposal to retrieve
 * @returns Proposal data with type information and loading state
 */
export const useProposalEnrichedById = (proposalId: string): UseProposalEnrichedByIdReturn => {
  const { enrichedGrantProposals, enrichedStandardProposals, isLoading } = useProposalEnriched()

  return useMemo(() => {
    const grantProposal = enrichedGrantProposals.find(p => p.id === proposalId)
    if (grantProposal) {
      return {
        proposal: grantProposal,
        type: ProposalType.Grant,
        isLoading: false,
      }
    }

    const standardProposal = enrichedStandardProposals.find(p => p.id === proposalId)
    if (standardProposal) {
      return {
        proposal: standardProposal,
        type: ProposalType.Standard,
        isLoading: false,
      }
    }

    // Fallback to Standard Proposal
    return {
      proposal: undefined,
      type: ProposalType.Standard,
      isLoading: true,
    }
  }, [proposalId, enrichedGrantProposals, enrichedStandardProposals, isLoading])
}
