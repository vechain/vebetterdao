import { abi } from "thor-devkit"
import { getAllEvents } from "@/api/blockchain/getEvents"
import { getConfig } from "@repo/config"
import { B3TRGovernorJson } from "@repo/contracts"
import { ProposalCreatedEvent } from "./getProposalsEvents"
const b3trGovernorAbi = B3TRGovernorJson.abi

const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

/**
 * Get the ProposalCreated events from the governor contract
 * @param thor - The thor instance
 * @param proposer - The proposer address to filter the events by
 * @returns An object containing the created proposals
 */
export const getProposalsCreatedEvents = async (thor: Connex.Thor, proposer?: string) => {
  const proposalCreatedAbi = b3trGovernorAbi.find(abi => abi.name === "ProposalCreated")
  if (!proposalCreatedAbi) throw new Error("ProposalCreated event not found")
  const proposalCreatedEvent = new abi.Event(proposalCreatedAbi as abi.Event.Definition)

  const topics = proposalCreatedEvent.encode({
    ...(proposer ? { proposer: proposer } : {}),
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
  const decodedCreateProposalEvents: ProposalCreatedEvent[] = []

  events.forEach(event => {
    switch (event.topics[0]) {
      case proposalCreatedEvent.signature: {
        const decoded = proposalCreatedEvent.decode(event.data, event.topics)

        decodedCreateProposalEvents.push({
          proposalId: decoded[0],
          proposer: decoded[1],
          targets: decoded[2],
          values: decoded[3],
          signatures: decoded[4],
          callDatas: decoded[5],
          description: decoded[6],
          roundIdVoteStart: decoded[7],
          depositThreshold: decoded[8],
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
    created: decodedCreateProposalEvents,
  }
}
