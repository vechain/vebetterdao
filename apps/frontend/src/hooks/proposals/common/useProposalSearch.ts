import { useMemo } from "react"

import { GrantFormData, GrantProposalEnriched, ProposalEnriched } from "../grants/types"

export type SearchableProposal = ProposalEnriched | GrantProposalEnriched | GrantFormData

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
      const title = "title" in proposal ? proposal?.title?.toLowerCase() : ""
      const projectName = "projectName" in proposal ? proposal?.projectName?.toLowerCase() : ""

      // Search across all relevant fields
      return title.includes(normalizedSearchTerm) || projectName.includes(normalizedSearchTerm)
    })
  }, [proposals, searchTerm])

  return searchedProposals
}
