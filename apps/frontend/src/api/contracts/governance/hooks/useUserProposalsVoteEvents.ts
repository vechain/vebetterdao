import { useQuery } from "@tanstack/react-query"
import { getProposalsVoteEvents } from "../getProposalsVotesEvents"
import { useMemo } from "react"
import { useWallet, useThor } from "@vechain/vechain-kit"

export const getUserProposalsVoteEventsQueryKey = (user?: string) => ["PROPOSALS", "ALL", "VOTES", user]

/**
 * Custom hook that retrieves the vote events of a specific user for all proposals.
 * @returns An object containing information about the vote event.
 */
export const useUserProposalsVoteEvents = (user?: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getUserProposalsVoteEventsQueryKey(user ?? undefined),
    queryFn: async () => {
      const { votes } = await getProposalsVoteEvents(thor, undefined, user ?? undefined)

      return votes
    },
    enabled: !!thor && !!user,
  })
}

/**
 * Custom hook that retrieves the vote of a specific user for a specific proposal.
 * @param proposalId - The ID of the proposal.
 * @returns An object containing information about the vote event.
 */
export const useUserSingleProposalVoteEvent = (proposalId?: string) => {
  const { account } = useWallet()
  const userProposalVoteEventsQuery = useUserProposalsVoteEvents(account?.address ?? undefined)

  const vote = useMemo(() => {
    return userProposalVoteEventsQuery.data?.find(vote => vote.proposalId === proposalId)
  }, [proposalId, userProposalVoteEventsQuery.data])

  return {
    ...userProposalVoteEventsQuery,
    data: vote,
  }
}
