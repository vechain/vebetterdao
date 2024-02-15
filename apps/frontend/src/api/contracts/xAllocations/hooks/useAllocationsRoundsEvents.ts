import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { abi } from "thor-devkit"
import { getEvents } from "@/api/blockchain"
import { getConfig } from "@repo/config"
import { XAllocationVotingJson } from "@repo/contracts"

const XALLOCATION_CONTRACT = getConfig().xAllocationVotingContractAddress

export type RoundCreated = {
  roundId: string
  proposer: string
  voteStart: string
  voteEnd: string
}

export const getAllocationsRoundsEvents = async (thor: Connex.Thor) => {
  const allocationCreatedAbi = XAllocationVotingJson.abi.find(abi => abi.name === "RoundCreated")
  if (!allocationCreatedAbi) throw new Error("RoundCreated event not found")
  const allocationCreatedEvent = new abi.Event(allocationCreatedAbi as abi.Event.Definition)

  /**
   * Filter criteria to get the events from the governor contract that we are interested in
   * This way we can get all of them in one call
   */
  const filterCriteria = [
    {
      address: XALLOCATION_CONTRACT,
      topic0: allocationCreatedEvent.signature,
    },
  ]

  const events = await getEvents({ thor, filterCriteria })

  /**
   * Decode the events to get the data we are interested in (i.e the proposals)
   */
  const decodedCreatedAllocationEvents: RoundCreated[] = []

  //   TODO: runtime validation with zod ?
  events.forEach(event => {
    switch (event.topics[0]) {
      case allocationCreatedEvent.signature: {
        const decoded = allocationCreatedEvent.decode(event.data, event.topics)
        decodedCreatedAllocationEvents.push({
          roundId: decoded[0],
          proposer: decoded[1],
          voteStart: decoded[2],
          voteEnd: decoded[3],
        })
        break
      }

      default: {
        throw new Error("Unknown event")
      }
    }
  })

  return {
    created: decodedCreatedAllocationEvents,
  }
}

export const getAllocationsRoundsEventsQueryKey = () => ["allocationRoundsEvents"]

/**
 *  Hook to get the allocation rounds events from the xAllocationVoting contract (i.e the proposals created)
 * @returns  the allocation rounds events (i.e the proposals created)
 */
export const useAllocationsRoundsEvents = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAllocationsRoundsEventsQueryKey(),
    queryFn: async () => await getAllocationsRoundsEvents(thor),
    enabled: !!thor,
  })
}
