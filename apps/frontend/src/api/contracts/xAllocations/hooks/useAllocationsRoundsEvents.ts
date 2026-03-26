import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/x-allocation-voting-governance/XAllocationVoting__factory"

import { getEventsKey, useEvents } from "../../../../hooks/useEvents"

const abi = XAllocationVoting__factory.abi
const contractAddress = getConfig().xAllocationVotingContractAddress
export type RoundCreated = {
  roundId: string
  proposer: string
  voteStart: string
  voteEnd: string
  appsIds: string[]
}
/**
 * Hook to get the allocation rounds events from the xAllocationVoting contract
 * @returns  the allocation rounds events (i.e information about the rounds created)
 */
export const useAllocationsRoundsEvents = () => {
  const rawAllocationCreatedEvents = useEvents({
    contractAddress,
    abi,
    eventName: "RoundCreated",
    select: events =>
      events.map(({ decodedData, meta }) => ({
        roundId: decodedData.args.roundId.toString(),
        proposer: decodedData.args.proposer,
        voteStart: decodedData.args.voteStart.toString(),
        voteEnd: decodedData.args.voteEnd.toString(),
        appsIds: [...decodedData.args.appsIds],
        blockNumber: meta.blockNumber,
        txOrigin: meta.txOrigin,
      })),
    order: "asc",
  })
  const allocationEvents = rawAllocationCreatedEvents.data || []
  const isLoading = rawAllocationCreatedEvents.isLoading
  return {
    isLoading,
    data: {
      created: allocationEvents,
    },
    isError: rawAllocationCreatedEvents.isError,
    error: rawAllocationCreatedEvents.error,
  }
}
export const getAllocationsRoundsEventsQueryKey = () =>
  getEventsKey({ eventName: "RoundCreated", queryOptions: { order: "asc" } })
