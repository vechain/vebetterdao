import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { abi } from "thor-devkit"
import { getEvents } from "@/api/blockchain"
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
): Promise<AllocationVoteCastEvent | undefined> => {
  if (!roundId || !address) throw new Error("roundId and address are required")
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

  const events = await getEvents({ thor, filterCriteria })

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

  if (decodedAllocatedVoteEvents.length > 1) throw new Error("More than one event found")

  return decodedAllocatedVoteEvents[0]
}

export const getUserVotesInRoundQueryKey = (roundId?: string, address?: string) => [
  "allocationsRound",
  roundId,
  "userVotes",
  address,
]

/**
 *  Hook to get the allocation rounds events from the xAllocationVoting contract (i.e the proposals created)
 * @returns  the allocation rounds events (i.e the proposals created)
 */
export const useUserVotesInRound = (roundId?: string, address?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getUserVotesInRoundQueryKey(roundId, address),
    queryFn: async () => await getUserVotesInRound(thor, roundId, address),
    enabled: !!thor && !!thor.status.head.number && !!roundId && !!address,
  })
}
