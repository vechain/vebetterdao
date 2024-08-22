import { useConnex, useWallet } from "@vechain/dapp-kit-react"

import { useQuery } from "@tanstack/react-query"
import { getProposalsVoteEvents } from "../getProposalsVotesEvents"
import { useMemo } from "react"

export const getUserProposalsVoteEventsQueryKey = (user?: string) => ["PROPOSALS", "ALL", "VOTES", user]

/**
 * Custom hook that retrieves the vote events of a specific user for all proposals.
 * @returns An object containing information about the vote event.
 */
export const useUserProposalsVoteEvents = () => {
  const { account } = useWallet()
  const { thor } = useConnex()

  return useQuery({
    queryKey: getUserProposalsVoteEventsQueryKey(account ?? undefined),
    queryFn: async () => {
      const { votes } = await getProposalsVoteEvents(thor, undefined, account ?? undefined)

      return votes
    },
    enabled: !!thor && !!account,
  })
}

/**
 * Custom hook that retrieves the vote of a specific user for a specific proposal.
 * @param proposalId - The ID of the proposal.
 * @returns An object containing information about the vote event.
 */
export const useUserSingleProposalVoteEvent = (proposalId?: string) => {
  const userProposalVoteEventsQuery = useUserProposalsVoteEvents()

  const vote = useMemo(() => {
    return userProposalVoteEventsQuery.data?.find(vote => vote.proposalId === proposalId)
  }, [proposalId, userProposalVoteEventsQuery.data])

  return {
    ...userProposalVoteEventsQuery,
    data: vote,
  }
}
