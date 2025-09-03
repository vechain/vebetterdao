import { useProposalEnriched } from "@/hooks/proposals/common"
import { useMemo } from "react"

/**
 * Hook to get proposals voted by a user from a list of proposal ids.
 * @param proposalIds - The list of proposal ids to get the proposals for.
 * @returns The proposals voted by the user from the given ids.
 */
export const useUserVotedProposals = (proposalIds?: string[]) => {
  const { data: { proposals } = { proposals: [] } } = useProposalEnriched()

  const userVotedProposalsEnriched = useMemo(() => {
    return proposals?.filter(proposal => proposalIds?.includes(proposal.id))
  }, [proposals, proposalIds])

  //TODO: Make this a useQuery and refetch when casting vote
  return userVotedProposalsEnriched
}
