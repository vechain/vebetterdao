import { getAllEventLogs, ThorClient } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts/typechain-types"
import { EnvConfig } from "@repo/config/contracts"
import { FilterCriteria } from "@vechain/sdk-network"
import { ProposalCreatedEvent } from "./getProposalsEvents"

/**
 * Get the ProposalCreated events from the governor contract
 * @param thor - The thor instance
 * @param env - The environment config
 * @param proposer - The proposer address to filter the events by
 * @returns An object containing the created proposals
 */
export const getProposalsCreatedEvents = async (thor: ThorClient, env: EnvConfig, proposer?: string) => {
  const governanceContractAddress = getConfig(env).b3trGovernorAddress

  const eventAbi = thor.contracts
    .load(governanceContractAddress, B3TRGovernor__factory.abi)
    .getEventAbi("ProposalCreated")

  const topics = eventAbi.encodeFilterTopicsNoNull({
    ...(proposer ? { proposer: proposer } : {}),
  })

  /**
   * Filter criteria to get the events from the governor contract that we are interested in
   * This way we can get all of them in one call
   */
  const filterCriteria: FilterCriteria[] = [
    {
      criteria: {
        address: governanceContractAddress,
        topic0: topics[0] ?? undefined,
        topic1: topics[1] ?? undefined,
        topic2: topics[2] ?? undefined,
        topic3: topics[3] ?? undefined,
        topic4: topics[4] ?? undefined,
      },
      eventAbi,
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
  const decodedCreateProposalEvents: ProposalCreatedEvent[] = []

  events.forEach(event => {
    if (!event.decodedData) {
      throw new Error("Event data not decoded")
    }

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

    decodedCreateProposalEvents.push({
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
  })

  return {
    created: decodedCreateProposalEvents,
  }
}
