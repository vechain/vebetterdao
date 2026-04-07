import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useWallet } from "@vechain/vechain-kit"

import { useEvents } from "@/hooks/useEvents"
import { VoteType } from "@/types/voting"

const abi = B3TRGovernor__factory.abi
const contractAddress = getConfig().b3trGovernorAddress

export const mapSupportToVoteType = (support: number): VoteType | undefined => {
  switch (support) {
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
 * @param voterAddress Optional address to query. Falls back to connected wallet.
 * @returns An object containing information about the vote event.
 */
export const useUserProposalsVoteEvents = (voterAddress?: string) => {
  const { account } = useWallet()
  const address = voterAddress ?? account?.address ?? ""
  return useEvents({
    abi,
    contractAddress,
    eventName: "VoteCast",
    filterParams: { voter: address as `0x${string}` },
    select: events => events.map(event => event.decodedData.args),
    enabled: !!address,
  })
}

export const useUserSingleProposalVoteEvent = (proposalId?: string) => {
  const { account } = useWallet()
  return useEvents({
    abi,
    contractAddress,
    eventName: "VoteCast",
    filterParams: { voter: (account?.address ?? "") as `0x${string}`, proposalId: BigInt(proposalId ?? 0) },
    select: events => {
      const userVoteEvent = events?.[0]
      if (!userVoteEvent) return undefined

      const rawVote = userVoteEvent.decodedData.args
      return {
        ...rawVote,
        userVote: mapSupportToVoteType(rawVote.support),
        hasVoted: true,
      }
    },
    enabled: !!proposalId,
  })
}
