import { getAllEventLogs, ThorClient } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts/typechain-types"
import { EventLogs, FilterCriteria } from "@vechain/sdk-network"
import { ExtractAbiEvent, ExtractAbiEventNames, AbiParametersToPrimitiveTypes, Abi } from "abitype"

const abi = B3TRGovernor__factory.abi
const eventNames = [
  "ProposalCreated",
  "ProposalCanceled",
  "ProposalExecuted",
  "ProposalQueued",
  "ProposalDeposit",
] as ProposalEvents[]

type ProposalEvents = ExtractAbiEventNames<typeof abi>

// Utility type to extract event parameters from ABI
export type ExtractEventParams<T extends Abi, K extends string> = AbiParametersToPrimitiveTypes<
  ExtractAbiEvent<T, K>["inputs"],
  "outputs"
>

type ProposalCreatedEventParams = ExtractEventParams<typeof abi, "ProposalCreated">
type ProposalCanceledEventParams = ExtractEventParams<typeof abi, "ProposalCanceled">
type ProposalExecutedEventParams = ExtractEventParams<typeof abi, "ProposalExecuted">
type ProposalQueuedEventParams = ExtractEventParams<typeof abi, "ProposalQueued">
type ProposalDepositEventParams = ExtractEventParams<typeof abi, "ProposalDeposit">

export type ProposalMetadata = {
  title: string
  shortDescription: string
  markdownDescription: string
}
export type ProposalCreatedEvent = {
  proposalId: string
  proposer: string
  targets: string[]
  values: string[]
  signatures: string[]
  callDatas: string[]
  description: string
  roundIdVoteStart: string
  depositThreshold: string
  blockMeta: EventLogs["meta"]
}
export type ProposalCanceledEvent = {
  proposalId: string
  blockMeta: EventLogs["meta"]
}
export type ProposalExecutedEvent = {
  proposalId: string
  blockMeta: EventLogs["meta"]
}
export type ProposalQueuedEvent = {
  proposalId: string
  etaSeconds: string
  blockMeta: EventLogs["meta"]
}
export type ProposalDepositEvent = {
  depositor: string
  proposalId: string
  amount: string
  blockMeta: EventLogs["meta"]
}

export const getProposalsEvents = async (thor: ThorClient, proposalId?: string) => {
  if (!proposalId) throw new Error("Proposal ID is required")

  const governanceContractAddress = getConfig().b3trGovernorAddress
  const contract = thor.contracts.load(governanceContractAddress, abi)
  const proposalIdBytes = proposalId ? `0x${BigInt(proposalId).toString(16).padStart(64, "0")}` : undefined

  const eventAbis = eventNames.map(eventName => contract.getEventAbi(eventName))
  const eventTopics = eventAbis.map(abi => abi?.encodeFilterTopicsNoNull({ proposalId: proposalIdBytes }))
  const filterCriteria: FilterCriteria[] = eventTopics.map((topic, index) => ({
    criteria: {
      address: governanceContractAddress,
      topic0: topic?.[0] ?? undefined,
      topic1: proposalIdBytes,
    },
    eventAbi: eventAbis[index]!,
  }))

  const events = await getAllEventLogs({
    nodeUrl: getConfig().nodeUrl,
    thor,
    filterCriteria,
  })

  /**
   * Decode the events to get the data we are interested in (i.e the proposals)
   */
  const decodedCreatedProposalEvents: ProposalCreatedEvent[] = []
  const decodedCanceledProposalEvents: ProposalCanceledEvent[] = []
  const decodedExecutedProposalEvents: ProposalExecutedEvent[] = []
  const decodedQueuedProposalEvents: ProposalQueuedEvent[] = []
  const decodedDepositProposalEvents: ProposalDepositEvent[] = []

  //   TODO: runtime validation with zod ?
  events.forEach(event => {
    if (!event.decodedData) {
      throw new Error("Event data not decoded")
    }

    switch (event.topics[0]) {
      case eventTopics[0]: {
        const [
          proposalId,
          proposer,
          targets,
          values,
          signatures,
          callDatas,
          description,
          roundIdVoteStart,
          depositThreshold,
        ] = event.decodedData as unknown as ProposalCreatedEventParams

        decodedCreatedProposalEvents.push({
          proposalId: proposalId.toString(),
          proposer,
          targets: [...targets],
          values: values.map(value => value.toString()),
          signatures: [...signatures],
          callDatas: [...callDatas],
          description,
          roundIdVoteStart: roundIdVoteStart.toString(),
          depositThreshold: depositThreshold.toString(),
          blockMeta: event.meta,
        })
        break
      }
      case eventTopics[1]: {
        const [proposalId] = event.decodedData as unknown as ProposalCanceledEventParams
        decodedCanceledProposalEvents.push({
          proposalId: proposalId.toString(),
          blockMeta: event.meta,
        })
        break
      }
      case eventTopics[2]: {
        const [proposalId] = event.decodedData as unknown as ProposalExecutedEventParams
        decodedExecutedProposalEvents.push({
          proposalId: proposalId.toString(),
          blockMeta: event.meta,
        })
        break
      }
      case eventTopics[3]: {
        const [proposalId, etaSeconds] = event.decodedData as unknown as ProposalQueuedEventParams
        decodedQueuedProposalEvents.push({
          proposalId: proposalId.toString(),
          etaSeconds: etaSeconds.toString(),
          blockMeta: event.meta,
        })
        break
      }
      case eventTopics[4]: {
        const [depositor, proposalId, amount] = event.decodedData as unknown as ProposalDepositEventParams
        decodedDepositProposalEvents.push({
          depositor,
          proposalId: proposalId.toString(),
          amount: amount.toString(),
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
    created: decodedCreatedProposalEvents,
    canceled: decodedCanceledProposalEvents,
    executed: decodedExecutedProposalEvents,
    queued: decodedQueuedProposalEvents,
    deposits: decodedDepositProposalEvents,
  }
}
