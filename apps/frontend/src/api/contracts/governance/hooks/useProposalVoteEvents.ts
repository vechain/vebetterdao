import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { compareAddresses } from "@repo/utils/AddressUtils"

import { abi } from "thor-devkit"
import { getAllEvents } from "@/api/blockchain/getEvents"
import { getConfig } from "@repo/config"
import { B3TRGovernorJson } from "@repo/contracts"
import { useQuery } from "@tanstack/react-query"
const b3trGovernorAbi = B3TRGovernorJson.abi

const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

export type ProposalVoteEvent = {
  account: string
  proposalId: string
  support: string
  weight: string
  power: string
  reason: string
  blockMeta: Connex.Thor.Filter.WithMeta["meta"]
}

export const getProposalsVoteEvents = async (thor: Connex.Thor, proposalId?: string) => {
  const proposalVoteAbi = b3trGovernorAbi.find(abi => abi.name === "VoteCast")
  if (!proposalVoteAbi) throw new Error("ProposalVote event not found")
  const proposalVoteEvent = new abi.Event(proposalVoteAbi as abi.Event.Definition)

  const proposalIdBytes = proposalId ? `0x${BigInt(proposalId).toString(16).padStart(64, "0")}` : undefined

  /**
   * Filter criteria to get the events from the governor contract that we are interested in
   * This way we can get all of them in one call
   */
  const filterCriteria = [
    {
      address: GOVERNANCE_CONTRACT,
      topic0: proposalVoteEvent.signature,
      topic2: proposalIdBytes,
    },
  ]

  const events = await getAllEvents({ thor, filterCriteria })

  /**
   * Decode the events to get the data we are interested in (i.e the proposals)
   */
  const decodedVoteProposalEvents: ProposalVoteEvent[] = []

  //   TODO: runtime validation with zod ?
  events.forEach(event => {
    switch (event.topics[0]) {
      case proposalVoteEvent.signature: {
        const decoded = proposalVoteEvent.decode(event.data, event.topics)

        decodedVoteProposalEvents.push({
          account: decoded[0],
          proposalId: decoded[1],
          support: decoded[2],
          weight: decoded[3],
          power: decoded[4],
          reason: decoded[5],
          blockMeta: event.meta,
        })
        break
      }
      default: {
        throw new Error("Unknown event")
      }
    }
  })

  return {
    votes: decodedVoteProposalEvents,
  }
}

export const getProposalVoteEventsQueryKey = (proposalId: string) => ["PROPOSALS", proposalId, "VOTES"]

/**
 * Custom hook that retrieves the vote event for a specific proposal.
 * @param proposalId - The ID of the proposal.
 * @returns An object containing information about the vote event.
 */
export const useProposalVoteEvents = (proposalId: string) => {
  const { account } = useWallet()
  const { thor } = useConnex()

  return useQuery({
    queryKey: getProposalVoteEventsQueryKey(proposalId),
    queryFn: async () => {
      const { votes } = await getProposalsVoteEvents(thor, proposalId)
      const totalVot3UsedInVotes = votes.reduce((acc, event) => acc + Number(event.weight), 0)
      const totalVotingPowerUsedInVotes = votes.reduce((acc, event) => acc + Number(event.power), 0)
      const votesWithComment = votes.filter(event => !!event.reason)
      const userVote = votes.find(event => compareAddresses(event.account, account || ""))
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
