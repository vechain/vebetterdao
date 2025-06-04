import { getAllEventLogs, ThorClient } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts/typechain-types"
import { FilterCriteria } from "@vechain/sdk-network"

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
 * @param thor - The thor client
 * @param proposalId - The proposal id to get the events (optional)
 * @param voter - The voter address to filter by (optional)
 * @returns The proposal vote events
 */
export const getProposalsVoteEvents = async (thor: ThorClient, proposalId?: string, voter?: string) => {
  const governanceContractAddress = getConfig().b3trGovernorAddress

  const eventAbi = thor.contracts.load(governanceContractAddress, B3TRGovernor__factory.abi).getEventAbi("VoteCast")

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
    nodeUrl: thor.httpClient.baseURL,
    thor,
    from: 0,
    to: undefined,
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

    const [account, proposalId, support, weight, power, reason] = event.decodedData as [
      string,
      bigint,
      bigint,
      bigint,
      bigint,
      string,
    ]

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
