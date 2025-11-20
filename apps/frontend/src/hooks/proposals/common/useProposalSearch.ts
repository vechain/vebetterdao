import { useMemo } from "react"

import { GrantDetail } from "@/app/grants/types"
import { ProposalDetail } from "@/app/proposals/types"

import { GrantFormData } from "../grants/types"

export type SearchableProposal = ProposalDetail | GrantDetail | GrantFormData
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
      let title = ""
      let projectName = ""

      // ProposalDetail
      if ("metadata" in proposal) {
        title = proposal?.metadata.title?.toLowerCase()
        // GrantDetail
        if ("projectName" in proposal.metadata) projectName = (proposal?.metadata?.projectName).toLowerCase()
      } else if ("projectName" in proposal) {
        // Draft Grant
        projectName = proposal.projectName
      }

      // Search across all relevant fields
      return title.includes(normalizedSearchTerm) || projectName.includes(normalizedSearchTerm)
    })
  }, [proposals, searchTerm])
  return searchedProposals
}
