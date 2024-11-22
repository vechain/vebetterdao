import { getConfig } from "@repo/config"
import { VoterRewards__factory } from "@repo/contracts"
import { getAllEvents } from "@/api/blockchain"
import { useConnex } from "@vechain/dapp-kit-react"
import { abi } from "thor-devkit"
import { useQuery } from "@tanstack/react-query"

import { ethers } from "ethers"

const VOTER_REWARDS_CONTRACT = getConfig().voterRewardsContractAddress

export type VoteRegisteredEvent = {
  cycle: number
  voter: string
  votes: number
  rewardWeightedVote: string
}

/**
 * Fetches all VoteRegistered events
 * @param {Connex.Thor} thor
 * @returns {Promise<VoteRegisteredEvent[]>}
 */

export const getVoteRegisteredEvents = async (
  thor: Connex.Thor,
  filterOptions?: { cycle?: number; voter?: string },
): Promise<VoteRegisteredEvent[]> => {
  const eventFragment = VoterRewards__factory.createInterface().getEvent("VoteRegistered").format("json")
  const voteRegisteredEvent = new abi.Event(JSON.parse(eventFragment) as abi.Event.Definition)

  const topics = voteRegisteredEvent.encode({
    cycle: filterOptions?.cycle ?? undefined,
    voter: filterOptions?.voter ?? undefined,
  })

  const filterCriteria = [
    {
      address: VOTER_REWARDS_CONTRACT,
      topic0: topics[0] ?? undefined,
      topic1: topics[1] ?? undefined,
      topic2: topics[2] ?? undefined,
      topic3: topics[3] ?? undefined,
      topic4: topics[4] ?? undefined,
    },
  ]

  const events = await getAllEvents({ thor, filterCriteria })

  const decodedVoteRegisteredEvents: VoteRegisteredEvent[] = []

  events.forEach(event => {
    switch (event.topics[0]) {
      case voteRegisteredEvent.signature: {
        const decoded = voteRegisteredEvent.decode(event.data, event.topics)
        const rewardWeightedVote = ethers.formatEther(decoded[3] as string)

        decodedVoteRegisteredEvents.push({
          cycle: decoded[0],
          voter: decoded[1],
          votes: decoded[2],
          rewardWeightedVote: rewardWeightedVote,
        })
        break
      }

      default: {
        throw new Error("Unknown event")
      }
    }
  })
  return decodedVoteRegisteredEvents
}

export const getVoteRegisteredEventsQueryKey = (filterOptions?: { cycle?: number; voter?: string }) => {
  return ["voteRegisteredEvents", filterOptions]
}

/**
 * Hook to get all VoteRegistered events from the Voter Rewards contract
 * @returns {UseQueryResult<VoteRegisteredEvent[], Error>}
 */

export const useVoteRegisteredEvents = (filterOptions?: { cycle?: number; voter?: string }) => {
  const { thor } = useConnex()

  const result = useQuery({
    queryKey: getVoteRegisteredEventsQueryKey(filterOptions),
    queryFn: async () => getVoteRegisteredEvents(thor, filterOptions),
  })

  return result
}
