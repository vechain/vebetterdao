import { useQuery } from "@tanstack/react-query"
import { useWallet, useThor } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { getProposalsVoteEvents } from "../getProposalsVotesEvents"

import { VoteType } from "@/types/voting"

/**
 * Map numeric support values to VoteType enum
 * @param support - The numeric support value (0, 1, 2)
 * @returns The corresponding VoteType enum value
 */
const mapSupportToVoteType = (support: string): VoteType | undefined => {
  const supportValue = Number(support)
  switch (supportValue) {
    case 0:
      return VoteType.VOTE_AGAINST
    case 1:
      return VoteType.VOTE_FOR
    case 2:
      return VoteType.ABSTAIN
    default:
      return undefined
  }
}
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
 * @returns An object containing information about the vote event with mapped vote type.
 */
export const useUserSingleProposalVoteEvent = (proposalId?: string) => {
  const { account } = useWallet()
  const userProposalVoteEventsQuery = useUserProposalsVoteEvents(account?.address ?? undefined)

  const vote = useMemo(() => {
    const rawVote = userProposalVoteEventsQuery.data?.find(vote => vote.proposalId === proposalId)
    if (!rawVote) return undefined

    return {
      ...rawVote,
      userVote: mapSupportToVoteType(rawVote.support),
      hasVoted: true,
    }
  }, [proposalId, userProposalVoteEventsQuery.data])

  return {
    ...userProposalVoteEventsQuery,
    data: vote,
  }
}
