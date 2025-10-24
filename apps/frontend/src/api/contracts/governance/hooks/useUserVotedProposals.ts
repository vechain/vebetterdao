import { useMemo } from "react"

import { useProposalEnriched } from "../../../../hooks/proposals/common/useProposalEnriched"

//TODO: Double check this hook
/**
 * Hook to get proposals voted by a user from a list of proposal ids.
 * @param proposalIds - The list of proposal ids to get the proposals for.
 * @returns The proposals voted by the user from the given ids.
 */
export const useUserVotedProposals = (proposalIds?: string[]) => {
  const { data: { enrichedProposals } = { enrichedProposals: [] } } = useProposalEnriched()
  const userVotedProposalsEnriched = useMemo(() => {
    return enrichedProposals?.filter(proposal => proposalIds?.includes(proposal.id))
  }, [enrichedProposals, proposalIds])
  //TODO: Make this a useQuery and refetch when casting vote
  return userVotedProposalsEnriched
}
