import { getAllEventLogs, ThorClient } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts/typechain-types"
import { EnvConfig } from "@repo/config/contracts"
import { FilterCriteria } from "@vechain/sdk-network"

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
  blockMeta: Connex.Thor.Filter.WithMeta["meta"]
}

export type ProposalCanceledEvent = {
  proposalId: string
  blockMeta: Connex.Thor.Filter.WithMeta["meta"]
}

export type ProposalExecutedEvent = {
  proposalId: string
  blockMeta: Connex.Thor.Filter.WithMeta["meta"]
}

export type ProposalQueuedEvent = {
  proposalId: string
  etaSeconds: string
  blockMeta: Connex.Thor.Filter.WithMeta["meta"]
}

export type ProposalDepositEvent = {
  depositor: string
  proposalId: string
  amount: string
  blockMeta: Connex.Thor.Filter.WithMeta["meta"]
}

export const getProposalsEvents = async (thor: ThorClient, env: EnvConfig, proposalId?: string) => {
  const governanceContractAddress = getConfig(env).b3trGovernorAddress

  const proposalCreatedEventAbi = thor.contracts
    .load(governanceContractAddress, B3TRGovernor__factory.abi)
    .getEventAbi("ProposalCreated")

  const proposalCanceledEventAbi = thor.contracts
    .load(governanceContractAddress, B3TRGovernor__factory.abi)
    .getEventAbi("ProposalCanceled")

  const proposalExecutedEventAbi = thor.contracts
    .load(governanceContractAddress, B3TRGovernor__factory.abi)
    .getEventAbi("ProposalExecuted")

  const proposalQueuedEventAbi = thor.contracts
    .load(governanceContractAddress, B3TRGovernor__factory.abi)
    .getEventAbi("ProposalQueued")

  const proposalDepositEventAbi = thor.contracts
    .load(governanceContractAddress, B3TRGovernor__factory.abi)
    .getEventAbi("ProposalDeposit")

  const proposalIdBytes = proposalId ? `0x${BigInt(proposalId).toString(16).padStart(64, "0")}` : undefined

  const proposalCreatedTopics = proposalCreatedEventAbi.encodeFilterTopicsNoNull({
    ...(proposalId ? { proposalId: proposalIdBytes } : {}),
  })
  const proposalCanceledTopics = proposalCanceledEventAbi.encodeFilterTopicsNoNull({
    ...(proposalId ? { proposalId: proposalIdBytes } : {}),
  })
  const proposalExecutedTopics = proposalExecutedEventAbi.encodeFilterTopicsNoNull({
    ...(proposalId ? { proposalId: proposalIdBytes } : {}),
  })
  const proposalQueuedTopics = proposalQueuedEventAbi.encodeFilterTopicsNoNull({
    ...(proposalId ? { proposalId: proposalIdBytes } : {}),
  })
  const proposalDepositTopics = proposalDepositEventAbi.encodeFilterTopicsNoNull({
    ...(proposalId ? { proposalId: proposalIdBytes } : {}),
  })

  /**
   * Filter criteria to get the events from the governor contract that we are interested in
   * This way we can get all of them in one call
   */
  const filterCriteria: FilterCriteria[] = [
    {
      criteria: {
        address: governanceContractAddress,
        topic0: proposalCreatedTopics[0] ?? undefined,
        topic1: proposalIdBytes,
      },
      eventAbi: proposalCreatedEventAbi,
    },
    {
      criteria: {
        address: governanceContractAddress,
        topic0: proposalCanceledTopics[0] ?? undefined,
        topic1: proposalIdBytes,
      },
      eventAbi: proposalCanceledEventAbi,
    },
    {
      criteria: {
        address: governanceContractAddress,
        topic0: proposalExecutedTopics[0] ?? undefined,
        topic1: proposalIdBytes,
      },
      eventAbi: proposalExecutedEventAbi,
    },
    {
      criteria: {
        address: governanceContractAddress,
        topic0: proposalQueuedTopics[0] ?? undefined,
        topic1: proposalIdBytes,
      },
      eventAbi: proposalQueuedEventAbi,
    },
    {
      criteria: {
        address: governanceContractAddress,
        topic0: proposalDepositTopics[0] ?? undefined,
        topic2: proposalIdBytes,
      },
      eventAbi: proposalDepositEventAbi,
    },
  ]

  const events = await getAllEventLogs({
    nodeUrl: thor.httpClient.baseURL,
    thor,
    from: 0,
    to: undefined,
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
      case proposalCreatedTopics[0]: {
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
        ] = event.decodedData as [bigint, string, string[], bigint[], string[], string[], string, bigint, bigint]

        decodedCreatedProposalEvents.push({
          proposalId: proposalId.toString(),
          proposer,
          targets,
          values: values.map(value => value.toString()),
          signatures,
          callDatas,
          description,
          roundIdVoteStart: roundIdVoteStart.toString(),
          depositThreshold: depositThreshold.toString(),
          blockMeta: event.meta,
        })
        break
      }
      case proposalCanceledTopics[0]: {
        const [proposalId] = event.decodedData as [bigint]
        decodedCanceledProposalEvents.push({
          proposalId: proposalId.toString(),
          blockMeta: event.meta,
        })
        break
      }
      case proposalExecutedTopics[0]: {
        const [proposalId] = event.decodedData as [bigint]
        decodedExecutedProposalEvents.push({
          proposalId: proposalId.toString(),
          blockMeta: event.meta,
        })
        break
      }
      case proposalQueuedTopics[0]: {
        const [proposalId, etaSeconds] = event.decodedData as [bigint, bigint]
        decodedQueuedProposalEvents.push({
          proposalId: proposalId.toString(),
          etaSeconds: etaSeconds.toString(),
          blockMeta: event.meta,
        })
        break
      }
      case proposalDepositTopics[0]: {
        const [depositor, proposalId, amount] = event.decodedData as [string, bigint, bigint]
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
