import { getAllEventLogs, ThorClient } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { EventLogs, FilterCriteria } from "@vechain/sdk-network"
import { ExtractAbiEvent, ExtractAbiEventNames, AbiParametersToPrimitiveTypes, Abi } from "abitype"
import { decodeEventLog } from "./getEvents"

const abi = B3TRGovernor__factory.abi
const address = getConfig().b3trGovernorAddress as `0x${string}`
const eventNames = ["ProposalCanceled", "ProposalExecuted", "ProposalQueued", "ProposalDeposit"] as ProposalEvents[]

type ProposalEvents = ExtractAbiEventNames<typeof abi>

// Utility type to extract event parameters from ABI
export type ExtractEventParams<T extends Abi, K extends string> = AbiParametersToPrimitiveTypes<
  ExtractAbiEvent<T, K>["inputs"],
  "outputs"
>

export type ProposalMetadata = {
  title: string
  shortDescription: string
  markdownDescription: string
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
  const contract = thor.contracts.load(address, abi)
  const eventAbis = eventNames.map(eventName => contract.getEventAbi(eventName))
  const eventTopics = eventAbis.map(abi => abi?.encodeFilterTopicsNoNull({ proposalId }))

  const filterCriteria: FilterCriteria[] = eventTopics.map((topic, index) => ({
    criteria: {
      address,
      topic0: topic?.[0],
      topic1: topic?.[1],
      topic2: topic?.[2],
      topic3: topic?.[3],
      topic4: topic?.[4],
    },
    eventAbi: eventAbis[index]!,
  }))

  const events = (
    await getAllEventLogs({
      nodeUrl: getConfig().nodeUrl,
      thor,
      filterCriteria,
    })
  ).map(event => decodeEventLog(event, abi))

  /**
   * Decode the events to get the data we are interested in (i.e the proposals)
   */
  const decodedCanceledProposalEvents: ProposalCanceledEvent[] = []
  const decodedExecutedProposalEvents: ProposalExecutedEvent[] = []
  const decodedQueuedProposalEvents: ProposalQueuedEvent[] = []
  const decodedDepositProposalEvents: ProposalDepositEvent[] = []

  events.forEach(({ decodedData, meta: blockMeta }) => {
    switch (decodedData.eventName) {
      case "ProposalCanceled": {
        const { proposalId } = decodedData.args
        decodedCanceledProposalEvents.push({
          proposalId: proposalId.toString(),
          blockMeta,
        })
        break
      }
      case "ProposalExecuted": {
        const { proposalId } = decodedData.args
        decodedExecutedProposalEvents.push({
          proposalId: proposalId.toString(),
          blockMeta,
        })
        break
      }
      case "ProposalQueued": {
        const { proposalId, etaSeconds } = decodedData.args
        decodedQueuedProposalEvents.push({
          proposalId: proposalId.toString(),
          etaSeconds: etaSeconds.toString(),
          blockMeta,
        })
        break
      }
      case "ProposalDeposit": {
        const { depositor, proposalId, amount } = decodedData.args
        decodedDepositProposalEvents.push({
          depositor,
          proposalId: proposalId.toString(),
          amount: amount.toString(),
          blockMeta,
        })
        break
      }

      default: {
        throw new Error(`Unknown event: ${decodedData.eventName}`)
      }
    }
  })

  return {
    canceled: decodedCanceledProposalEvents,
    executed: decodedExecutedProposalEvents,
    queued: decodedQueuedProposalEvents,
    deposits: decodedDepositProposalEvents,
  }
}
