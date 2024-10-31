import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { abi } from "thor-devkit"
import { getAllEvents } from "@/api/blockchain"
import { getConfig } from "@repo/config"
import { VoterRewards__factory } from "@repo/contracts"

const VOTER_REWARDS_CONTRACT = getConfig().voterRewardsContractAddress
const method = "VoteRegistered"

export type VoteRegisteredEvent = {
  cycle: number
  voter: string
  votes: number
  rewardWeightedVote: number
}

/**
 * Fetches all GetVoteRegistered events
 * @param {Connex.Thor} thor
 * @returns {Promise<VoteRegisteredEvent[]>}
 */
export const getVoteRegisteredEvents = async (
  thor: Connex.Thor,
  filterOptions?: { cycle?: number; voter?: string },
): Promise<VoteRegisteredEvent[]> => {
  const eventFragment = VoterRewards__factory.createInterface().getEvent(method).format("json")
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
    },
  ]

  const events = await getAllEvents({ thor, filterCriteria })

  /**
   * Decode the events to get the data we are interested in (i.e the voteRegistered)
   */
  const decodedVoteRegisteredEvents: VoteRegisteredEvent[] = []

  events.forEach(event => {
    switch (event.topics[0]) {
      case voteRegisteredEvent.signature: {
        const decoded = voteRegisteredEvent.decode(event.data, event.topics)
        decodedVoteRegisteredEvents.push({
          cycle: decoded[0],
          voter: decoded[1],
          votes: decoded[2],
          rewardWeightedVote: decoded[3],
        })
      }
    }
  })

  return decodedVoteRegisteredEvents
}

export const getVoteRegisteredEventsQueryKey = (filterOptions?: { cycle?: number; voter?: string }) => [
  "VoteRegisteredEvents",
  filterOptions,
]

/**
 * Hook to get all AppEndorsed events from the X2EarnApps contract
 * @returns {UseQueryResult<VoteRegisteredEvent[], Error>}
 */
export const useGetVoteRegisteredEvent = (filterOptions?: { cycle?: number; voter?: string }) => {
  const { thor } = useConnex()

  const cycleToVoterToTotal = useQuery({
    queryKey: getVoteRegisteredEventsQueryKey(filterOptions),
    queryFn: async () => await getVoteRegisteredEvents(thor, filterOptions),
    enabled: !!thor,
  })

  return { cycleToVoterToTotal }
}
