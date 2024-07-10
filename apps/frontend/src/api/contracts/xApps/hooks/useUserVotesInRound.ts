import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { abi, address } from "thor-devkit"
import { getAllEvents } from "@/api/blockchain"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@repo/contracts"

const XAllocationVotingInterface = XAllocationVoting__factory.createInterface()

const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

export type AllocationVoteCastEvent = {
  voter: string
  roundId: string
  appsIds: string[]
  voteWeights: string[]
}

export const getUserVotesInRound = async (
  thor: Connex.Thor,
  roundId?: string,
  address?: string,
): Promise<AllocationVoteCastEvent[]> => {
  if (!roundId) throw new Error("roundId is required")
  const eventFragment = XAllocationVotingInterface.getEvent("AllocationVoteCast").format("json")
  const allocationVoteCast = new abi.Event(JSON.parse(eventFragment) as abi.Event.Definition)

  const topics = allocationVoteCast.encode({ voter: address, roundId })
  /**
   * Filter criteria to get the events from the governor contract that we are interested in
   * This way we can get all of them in one call
   */
  const filterCriteria: Connex.Thor.Filter.Criteria<"event">[] = [
    {
      address: XALLOCATIONVOTING_CONTRACT,
      topic0: topics[0] ?? undefined,
      topic1: topics[1] ?? undefined,
      topic2: topics[2] ?? undefined,
      topic3: topics[3] ?? undefined,
      topic4: topics[4] ?? undefined,
    },
  ]

  const events = await getAllEvents({ thor, filterCriteria })

  /**
   * Decode the events to get the data we are interested in (i.e the proposals)
   */
  const decodedAllocatedVoteEvents: AllocationVoteCastEvent[] = []

  //   TODO: runtime validation with zod ?
  events.forEach(event => {
    switch (event.topics[0]) {
      case allocationVoteCast.signature: {
        const decoded = allocationVoteCast.decode(event.data, event.topics)
        decodedAllocatedVoteEvents.push({
          voter: decoded[0],
          roundId: decoded[1],
          appsIds: decoded[2],
          voteWeights: decoded[3],
        })
        break
      }

      default: {
        throw new Error("Unknown event")
      }
    }
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
  const { thor } = useConnex()

  return useQuery({
    queryKey: getUserVotesInRoundQueryKey(roundId, address),
    queryFn: async () => {
      const votes = await getUserVotesInRound(thor, roundId, address)
      if (votes.length > 1) throw new Error("More than one event found")
      if (votes.length === 0) throw new Error("No event found")
      return votes[0]
    },
    enabled: !!thor && !!thor.status.head.number && !!roundId && !!address,
  })
}

/**
 *  Hook to get the allocation rounds events from the xAllocationVoting contract (i.e the proposals created)
 * @returns  the allocation rounds events (i.e the proposals created)
 */
export const useVotesInRound = (roundId?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getUserVotesInRoundQueryKey(roundId),
    queryFn: async () => await getUserVotesInRound(thor, roundId),

    enabled: !!thor && !!thor.status.head.number && !!roundId && !!address,
  })
}
