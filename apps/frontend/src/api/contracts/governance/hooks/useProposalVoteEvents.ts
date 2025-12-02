import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import { useWallet } from "@vechain/vechain-kit"

import { useEvents } from "@/hooks/useEvents"
import { compareAddresses } from "@/utils/AddressUtils/AddressUtils"

const abi = B3TRGovernor__factory.abi
const contractAddress = getConfig().b3trGovernorAddress

export const useProposalVoteEvents = (proposalId: string) => {
  const { account } = useWallet()
  return useEvents({
    abi,
    contractAddress,
    eventName: "VoteCast",
    filterParams: [account?.address, BigInt(proposalId)],
    select: events => {
      const votes = events.map(event => event.decodedData.args)
      const totalVot3UsedInVotes = votes.reduce((acc, event) => acc + Number(event.weight), 0)
      const totalVotingPowerUsedInVotes = votes.reduce((acc, event) => acc + Number(event.power), 0)
      const votesWithComment = votes.filter(event => !!event.reason)
      const userVote = !!account?.address ? votes.find(event => compareAddresses(event.voter, account.address)) : []
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
  })
}
