import { useMemo } from "react"

import { useProposalEnriched } from "./useProposalEnriched"

/**
 * Hook to return the enriched proposal and the ty[e of the proposal ] given a proposalId
 *
 * @param proposalId - The ID of the proposal to retrieve
 * @returns Proposal data
 */
export const useProposalEnrichedById = (proposalId: string) => {
  const { data: { proposals } = { proposals: [] } } = useProposalEnriched()

  return useMemo(() => proposals.find(p => p.id === proposalId), [proposalId, proposals])
}
