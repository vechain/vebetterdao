import { useMemo } from "react"

import { GrantProposalEnriched, ProposalEnriched } from "../grants/types"

export type SearchableProposal = ProposalEnriched | GrantProposalEnriched

/**
 * Custom hook for searching proposals by text
 * Searches based on title
 */
export const useProposalSearch = (proposals: SearchableProposal[], searchTerm: string) => {
  const searchedProposals = useMemo(() => {
    if (!searchTerm.trim()) {
      return proposals
    }

    const normalizedSearchTerm = searchTerm.toLowerCase().trim()

    return proposals.filter(proposal => {
      // Primary search fields with higher priority
      const title = proposal?.title?.toLowerCase() || ""

      // Search across all relevant fields
      return title.includes(normalizedSearchTerm)
    })
  }, [proposals, searchTerm])

  return searchedProposals
}
