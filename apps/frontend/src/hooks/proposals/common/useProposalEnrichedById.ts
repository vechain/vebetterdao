import { useMemo } from "react"

import { useProposalEnriched } from "./useProposalEnriched"

/**
 * Hook to return the enriched proposal by ID
 * Now much simpler and reactive since useProposalEnriched provides enriched data
 *
 * @param proposalId - The ID of the proposal to retrieve
 * @returns Enriched proposal data with reactive updates
 */
export const useProposalEnrichedById = (proposalId: string) => {
  const { data: { enrichedProposals } = { enrichedProposals: [] }, isLoading } = useProposalEnriched()
  // Find the enriched proposal by ID using useMemo for performance
  const proposal = useMemo(() => {
    return enrichedProposals?.find(p => p.id === proposalId)
  }, [enrichedProposals, proposalId])
  return {
    data: proposal,
    isLoading,
  }
}
