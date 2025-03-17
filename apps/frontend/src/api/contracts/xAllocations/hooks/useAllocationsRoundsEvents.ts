import { useEvents } from "@/hooks"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@repo/contracts"

const contractInterface = XAllocationVoting__factory.createInterface()
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
    contractInterface,
    eventName: "RoundCreated",
    mapResponse: (decoded, meta) => ({
      roundId: decoded.roundId,
      proposer: decoded.proposer,
      voteStart: decoded.voteStart,
      voteEnd: decoded.voteEnd,
      appsIds: decoded.appsIds,
      blockNumber: meta.blockNumber,
      txOrigin: meta.txOrigin,
    }),
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

export const getAllocationsRoundsEventsQueryKey = () => ["allocationRoundsEvents"]
