import { getAllEventLogs, ThorClient } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts/typechain-types"
import { EventLogs, FilterCriteria } from "@vechain/sdk-network"
import { ExtractEventParams } from "./getProposalsEvents"

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

  const events = await getAllEventLogs({
    nodeUrl: getConfig().nodeUrl,
    thor,
    filterCriteria,
  })

  /**
   * Decode the events to get the data we are interested in (i.e the proposals)
   */
  const decodedVoteProposalEvents: ProposalVoteEvent[] = []

  //   TODO: runtime validation with zod ?
  events.forEach(event => {
    if (!event.decodedData) {
      throw new Error("Event data not decoded")
    }

    const [account, proposalId, support, weight, power, reason] = event.decodedData as unknown as ExtractEventParams<
      typeof abi,
      "VoteCast"
    >

    decodedVoteProposalEvents.push({
      account,
      proposalId: proposalId.toString(),
      support: support.toString(),
      weight: weight.toString(),
      power: power.toString(),
      reason,
      blockMeta: event.meta,
    })
  })

  return {
    votes: decodedVoteProposalEvents,
  }
}
