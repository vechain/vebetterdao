import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { abi } from "thor-devkit"
import { getEvents } from "@/api/blockchain"
import { getConfig } from "@repo/config"
import { B3TRGovernorJson } from "@repo/contracts"
const b3trGovernorAbi = B3TRGovernorJson.abi

const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

export type ProposalCreatedEvent = {
  proposalId: string
  proposer: string
  targets: string[]
  values: string[]
  signatures: string[]
  callDatas: string[]
  voteStart: string
  voteEnd: string
  description: string
}

export type ProposalCanceledEvent = {
  proposalId: string
}

export type ProposalExecutedEvent = {
  proposalId: string
}

export type ProposalQueuedEvent = {
  proposalId: string
  etaSeconds: string
}

export const getProposalsEvents = async (thor: Connex.Thor) => {
  const proposalCreatedAbi = b3trGovernorAbi.find(abi => abi.name === "ProposalCreated")
  if (!proposalCreatedAbi) throw new Error("ProposalCreated event not found")
  const proposalCreatedEvent = new abi.Event(proposalCreatedAbi as abi.Event.Definition)

  const proposalCanceledAbi = b3trGovernorAbi.find(abi => abi.name === "ProposalCanceled")
  if (!proposalCanceledAbi) throw new Error("ProposalCanceled event not found")
  const proposalCanceledEvent = new abi.Event(proposalCanceledAbi as abi.Event.Definition)

  const proposalExecutedAbi = b3trGovernorAbi.find(abi => abi.name === "ProposalExecuted")
  if (!proposalExecutedAbi) throw new Error("ProposalExecuted event not found")
  const proposalExecutedEvent = new abi.Event(proposalExecutedAbi as abi.Event.Definition)

  const proposalQueuedAbi = b3trGovernorAbi.find(abi => abi.name === "ProposalQueued")
  if (!proposalQueuedAbi) throw new Error("ProposalQueued event not found")
  const proposalQueuedEvent = new abi.Event(proposalQueuedAbi as abi.Event.Definition)

  /**
   * Filter criteria to get the events from the governor contract that we are interested in
   * This way we can get all of them in one call
   */
  const filterCriteria = [
    {
      address: GOVERNANCE_CONTRACT,
      topic0: proposalCreatedEvent.signature,
    },
    {
      address: GOVERNANCE_CONTRACT,
      topic0: proposalCanceledEvent.signature,
    },
    {
      address: GOVERNANCE_CONTRACT,
      topic0: proposalExecutedEvent.signature,
    },
    {
      address: GOVERNANCE_CONTRACT,
      topic0: proposalQueuedEvent.signature,
    },
  ]

  const events = await getEvents({ thor, filterCriteria })

  console.log({ events })

  /**
   * Decode the events to get the data we are interested in (i.e the proposals)
   */
  const decodedCreatedProposalEvents: ProposalCreatedEvent[] = []
  const decodedCanceledProposalEvents: ProposalCanceledEvent[] = []
  const decodedExecutedProposalEvents: ProposalExecutedEvent[] = []
  const decodedQueuedProposalEvents: ProposalQueuedEvent[] = []

  //   TODO: runtime validation with zod ?
  events.forEach(event => {
    switch (event.topics[0]) {
      case proposalCreatedEvent.signature: {
        const decoded = proposalCreatedEvent.decode(event.data, event.topics)
        decodedCreatedProposalEvents.push({
          proposalId: decoded[0],
          proposer: decoded[1],
          targets: decoded[2],
          values: decoded[3],
          signatures: decoded[4],
          callDatas: decoded[5],
          voteStart: decoded[6],
          voteEnd: decoded[7],
          description: decoded[8],
        })
        break
      }
      case proposalCanceledEvent.signature: {
        const decoded = proposalCanceledEvent.decode(event.data, event.topics)
        decodedCanceledProposalEvents.push({
          proposalId: decoded[0],
        })
        break
      }
      case proposalExecutedEvent.signature: {
        const decoded = proposalExecutedEvent.decode(event.data, event.topics)
        decodedExecutedProposalEvents.push({
          proposalId: decoded[0],
        })
        break
      }
      case proposalQueuedEvent.signature: {
        const decoded = proposalQueuedEvent.decode(event.data, event.topics)
        decodedQueuedProposalEvents.push({
          proposalId: decoded[0],
          etaSeconds: decoded[1],
        })
        break
      }
      default: {
        throw new Error("Unknown event")
      }
    }
  })

  return {
    created: decodedCreatedProposalEvents,
    canceled: decodedCanceledProposalEvents,
    executed: decodedExecutedProposalEvents,
    queued: decodedQueuedProposalEvents,
  }
}

export const getProposalEvents = () => ["proposalsEvents"]

/**
 *  Hook to get the proposals events from the governor contract (i.e the proposals created, canceled and executed)
 * @returns  the proposals events
 */
export const useProposalsEvents = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getProposalEvents(),
    queryFn: async () => await getProposalsEvents(thor),
    enabled: !!thor && !!thor.status.head.number,
  })
}
