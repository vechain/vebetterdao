import { useProposalsEvents } from ".."
import { useMemo } from "react"

/**
 * Hook to get proposals created from a list of proposal ids.
 * @param proposalIds - The list of proposal ids to get the proposals for.
 * @returns The proposals created from the given ids.
 */
export const useProposalsCreatedFromIds = (proposalIds?: string[]) => {
  const {
    data: { created: allCreatedProposals },
  } = useProposalsEvents()

  const createdProposals = useMemo(() => {
    return allCreatedProposals?.filter(proposal => proposalIds?.includes(proposal.proposalId))
  }, [allCreatedProposals, proposalIds])

  return {
    created: createdProposals,
  }
}
