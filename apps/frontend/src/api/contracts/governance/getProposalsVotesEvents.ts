import { getConfig } from "@repo/config"
import { EventLogs, FilterCriteria } from "@vechain/sdk-network"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { getAllEventLogs, ThorClient } from "@vechain/vechain-kit"

import { decodeEventLog } from "./getEvents"

export type ProposalVoteEvent = {
  account: string
  proposalId: string
  support: string
  weight: string
  power: string
  reason: string
  blockMeta: EventLogs["meta"]
}
const abi = B3TRGovernor__factory.abi
const governanceContractAddress = getConfig().b3trGovernorAddress
const event = "VoteCast" as const
/**
 * Get the proposal vote events from the governor contract
 * @param thor - The thor client
 * @param proposalId - The proposal id to get the events (optional)
 * @param voter - The voter address to filter by (optional)
 * @returns The proposal vote events
 */
export const getProposalsVoteEvents = async (thor: ThorClient, proposalId?: string, voter?: string) => {
  const eventAbi = thor.contracts.load(governanceContractAddress, abi).getEventAbi(event)
  const topics = eventAbi.encodeFilterTopicsNoNull({
    ...(proposalId ? { proposalId: proposalId } : {}),
    ...(voter ? { voter: voter } : {}),
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
  const decodedVoteProposalEvents: ProposalVoteEvent[] = []

  events.forEach(({ decodedData, meta: blockMeta }) => {
    if (decodedData.eventName !== "VoteCast") throw new Error(`Unknown event: ${decodedData.eventName}`)

    const { voter: account, proposalId, support, weight, power, reason } = decodedData.args

    decodedVoteProposalEvents.push({
      account,
      proposalId: proposalId.toString(),
      support: support.toString(),
      weight: weight.toString(),
      power: power.toString(),
      reason,
      blockMeta,
    })
  })

  return {
    votes: decodedVoteProposalEvents,
  }
}
