import { getAllEventLogs, ThorClient } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { FilterCriteria } from "@vechain/sdk-network"
import { ProposalCreatedEvent } from "./getProposalsEvents"
import { decodeEventLog } from "./getEvents"

const abi = B3TRGovernor__factory.abi
const address = getConfig().b3trGovernorAddress as `0x${string}`

/**
 * Get the ProposalCreated events from the governor contract
 * @param thor - The thor instance
 * @param env - The environment config
 * @param proposer - The proposer address to filter the events by
 * @returns An object containing the created proposals
 */
export const getProposalsCreatedEvents = async (thor: ThorClient, proposer?: string) => {
  const eventAbi = thor.contracts.load(address, abi).getEventAbi("ProposalCreated")

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
        address,
        topic0: topics[0] ?? undefined,
        topic1: topics[1] ?? undefined,
        topic2: topics[2] ?? undefined,
        topic3: topics[3] ?? undefined,
        topic4: topics[4] ?? undefined,
      },
      eventAbi,
    },
  ]

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
  const decodedCreateProposalEvents: ProposalCreatedEvent[] = []

  events.forEach(({ decodedData, meta: blockMeta }) => {
    if (decodedData.eventName !== "ProposalCreated") throw new Error(`Unknown event: ${decodedData.eventName}`)

    const {
      proposalId,
      proposer,
      targets,
      values,
      signatures,
      calldatas,
      description,
      roundIdVoteStart,
      depositThreshold,
    } = decodedData.args

    decodedCreateProposalEvents.push({
      proposalId: proposalId.toString(),
      proposer,
      targets: [...targets],
      values: values.map(value => value.toString()),
      signatures: [...signatures],
      callDatas: [...calldatas],
      description,
      roundIdVoteStart: roundIdVoteStart.toString(),
      depositThreshold: depositThreshold.toString(),
      blockMeta,
    })
  })

  return {
    created: decodedCreateProposalEvents,
  }
}
