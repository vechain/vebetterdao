import { abi } from "thor-devkit"
import { getAllEvents } from "@/api/blockchain/getEvents"
import { getConfig } from "@repo/config"
import { B3TRGovernorJson } from "@repo/contracts"
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

/**
 * Get the proposal vote events from the governor contract
 * @param thor  the thor client
 * @param proposalId  the proposal id to get the events (optional)
 * @returns  the proposal vote events
 */
export const getProposalsVoteEvents = async (thor: Connex.Thor, proposalId?: string, voter?: string) => {
  const proposalVoteAbi = b3trGovernorAbi.find(abi => abi.name === "VoteCast")
  if (!proposalVoteAbi) throw new Error("ProposalVote event not found")
  const proposalVoteEvent = new abi.Event(proposalVoteAbi as abi.Event.Definition)

  const topics = proposalVoteEvent.encode({
    ...(proposalId ? { proposalId: proposalId } : {}),
    ...(voter ? { voter: voter } : {}),
  })

  /**
   * Filter criteria to get the events from the governor contract that we are interested in
   * This way we can get all of them in one call
   */
  const filterCriteria = [
    {
      address: GOVERNANCE_CONTRACT,
      topic0: topics[0] ?? undefined,
      topic1: topics[1] ?? undefined,
      topic2: topics[2] ?? undefined,
      topic3: topics[3] ?? undefined,
      topic4: topics[4] ?? undefined,
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
