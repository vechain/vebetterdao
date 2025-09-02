import { useUserCreatedProposal } from "@/hooks/proposals/common"
import { useMemo } from "react"

/**
 * Hook to get proposals created from a list of proposal ids.
 * @param proposalIds - The list of proposal ids to get the proposals for.
 * @returns The proposals created from the given ids.
 */
export const useProposalsCreatedFromIds = (proposalIds?: string[]) => {
  const { data: allCreatedProposals } = useUserCreatedProposal()

  const createdProposals = useMemo(() => {
    return allCreatedProposals?.filter(proposal => proposalIds?.includes(proposal.id))
  }, [allCreatedProposals, proposalIds])

  return {
    created: createdProposals,
  }
}
