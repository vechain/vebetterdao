import { useMemo } from "react"
import { useProposalEnriched } from "./useProposalEnriched"
import { ProposalType } from "../grants/types"

/**
 * Hook to get proposal type for a specific proposal ID
 * @param proposalId The proposal ID to check
 * @returns Object with type information and loading state
 */
export const useProposalType = (proposalId: string) => {
  const { proposals, isLoading } = useProposalEnriched()

  return useMemo(() => {
    const proposal = proposals.find(p => p.id === proposalId)

    if (!proposal) return null
    return {
      isGrant: proposal.type === ProposalType.Grant,
      isStandard: proposal.type === ProposalType.Standard,
      type: proposal.type,
      isLoading: isLoading || !proposal || proposal.type === undefined,
    }
  }, [proposals, proposalId, isLoading])
}
