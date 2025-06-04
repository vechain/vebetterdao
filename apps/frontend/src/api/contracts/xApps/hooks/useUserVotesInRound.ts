import { useQuery } from "@tanstack/react-query"
import { useThor, getAllEventLogs } from "@vechain/vechain-kit"
import { ThorClient, FilterCriteria } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@repo/contracts/typechain-types"

const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

export type AllocationVoteCastEvent = {
  voter: string
  roundId: string
  appsIds: string[]
  voteWeights: string[]
}

export const getUserVotesInRound = async (
  thor: ThorClient,
  roundId?: string,
  address?: string,
): Promise<AllocationVoteCastEvent[]> => {
  const eventAbi = thor.contracts
    .load(XALLOCATIONVOTING_CONTRACT, XAllocationVoting__factory.abi)
    .getEventAbi("AllocationVoteCast")

  const topics = eventAbi.encodeFilterTopicsNoNull({
    ...(address ? { voter: address } : {}),
    ...(roundId ? { roundId } : {}),
  })

  /**
   * Filter criteria to get the events from the xAllocationVoting contract that we are interested in
   * This way we can get all of them in one call
   */
  const filterCriteria: FilterCriteria[] = [
    {
      criteria: {
        address: XALLOCATIONVOTING_CONTRACT,
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
   * Decode the events to get the data we are interested in (i.e the vote events)
   */
  const decodedAllocatedVoteEvents: AllocationVoteCastEvent[] = []

  events.forEach(event => {
    if (!event.decodedData) {
      throw new Error("Event data not decoded")
    }

    const [voter, roundId, appsIds, voteWeights] = event.decodedData as [string, string, string[], string[]]

    decodedAllocatedVoteEvents.push({
      voter,
      roundId,
      appsIds,
      voteWeights,
    })
  })

  return decodedAllocatedVoteEvents
}

export const getUserVotesInRoundQueryKey = (roundId?: string, address?: string) => [
  "allocationsRound",
  roundId,
  "userVotes",
  ...(address ? [address] : []),
]

/**
 *  Hook to get the user votes in a given round from the xAllocationVoting contract
 * @returns the user votes in a given round from the xAllocationVoting contract
 */
export const useUserVotesInRound = (roundId?: string, address?: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getUserVotesInRoundQueryKey(roundId, address),
    queryFn: async () => {
      const votes = await getUserVotesInRound(thor, roundId, address)
      if (votes.length > 1) throw new Error("More than one event found")
      if (votes.length === 0) throw new Error("No event found")
      return votes[0]
    },
    enabled: !!thor && !!roundId && !!address,
  })
}

export const getVotesInRoundQueryKey = (roundId?: string) => ["allocationsRound", roundId, "totalVotes"]

/**
 *  Hook to get the allocation rounds events from the xAllocationVoting contract (i.e the proposals created)
 * @returns  the allocation rounds events (i.e the proposals created)
 */
export const useVotesInRound = (roundId?: string, enabled = true) => {
  const thor = useThor()

  return useQuery({
    queryKey: getVotesInRoundQueryKey(roundId),
    queryFn: async () => await getUserVotesInRound(thor, roundId),
    enabled: !!thor && !!roundId && enabled,
  })
}
