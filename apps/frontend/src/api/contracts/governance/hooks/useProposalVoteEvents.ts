import { compareAddresses } from "@repo/utils/AddressUtils"

import { useQuery } from "@tanstack/react-query"
import { getProposalsVoteEvents } from "../getProposalsVotesEvents"
import { useWallet, useThor } from "@vechain/vechain-kit"

export const getProposalVoteEventsQueryKey = (proposalId: string) => ["PROPOSALS", proposalId, "VOTES"]

/**
 * Custom hook that retrieves the vote event for a specific proposal.
 * @param proposalId - The ID of the proposal.
 * @returns An object containing information about the vote event.
 */
export const useProposalVoteEvents = (proposalId: string) => {
  const { account } = useWallet()
  const thor = useThor()

  return useQuery({
    queryKey: getProposalVoteEventsQueryKey(proposalId),
    queryFn: async () => {
      const { votes } = await getProposalsVoteEvents(thor, proposalId)
      const totalVot3UsedInVotes = votes.reduce((acc, event) => acc + Number(event.weight), 0)
      const totalVotingPowerUsedInVotes = votes.reduce((acc, event) => acc + Number(event.power), 0)
      const votesWithComment = votes.filter(event => !!event.reason)
      const userVote = votes.find(event => compareAddresses(event.account, account?.address ?? ""))
      const hasUserVoted = !!userVote
      return {
        hasUserVoted,
        userVote,
        votesWithComment,
        votes,
        totalVot3UsedInVotes,
        totalVotingPowerUsedInVotes,
      }
    },
    enabled: !!thor,
  })
}
