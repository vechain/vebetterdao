import { getConfig } from "@repo/config"
import { VoterRewards__factory } from "@repo/contracts"
import { getAllEvents } from "@/api/blockchain"
import { useConnex } from "@vechain/dapp-kit-react"
import { abi } from "thor-devkit"
import { useQuery } from "@tanstack/react-query"
import { ethers } from "ethers"

const VOTER_REWARDS_CONTRACT = getConfig().voterRewardsContractAddress

export type RewardClaimed = {
  cycle: number
  voter: string
  reward: number
  gmReward?: number
}

/**
 * Fetches all RewardClaimed events
 * @param {Connex.Thor} thor
 * @returns {Promise<RewardClaimed[]>}
 */
export const getRewardClaimedEvents = async (
  thor: Connex.Thor,
  filterOptions?: { cycle?: number; voter?: string },
): Promise<RewardClaimed[]> => {
  const eventFragment = VoterRewards__factory.createInterface().getEvent("RewardClaimed").format("json")
  const rewardClaimedEvent = new abi.Event(JSON.parse(eventFragment) as abi.Event.Definition)

  const eventFragmentV2 = VoterRewards__factory.createInterface().getEvent("RewardClaimedV2").format("json")
  const rewardClaimedEventV2 = new abi.Event(JSON.parse(eventFragmentV2) as abi.Event.Definition)

  const topics = rewardClaimedEvent.encode({
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
  const decodedRewardClaimedEvents: RewardClaimed[] = []

  events.forEach(event => {
    switch (event.topics[0]) {
      case rewardClaimedEvent.signature: {
        const decoded = rewardClaimedEvent.decode(event.data, event.topics)
        const rewardFormatted = Number(ethers.formatEther(decoded[2] as string))

        decodedRewardClaimedEvents.push({
          cycle: decoded[0],
          voter: decoded[1],
          reward: rewardFormatted,
        })
        break
      }
      case rewardClaimedEventV2.signature: {
        const decoded = rewardClaimedEventV2.decode(event.data, event.topics)
        const rewardFormatted = Number(ethers.formatEther(decoded[2] as string))
        const gmRewardFormatted = Number(ethers.formatEther(decoded[3] as string))

        decodedRewardClaimedEvents.push({
          cycle: decoded[0],
          voter: decoded[1],
          reward: rewardFormatted,
          gmReward: gmRewardFormatted,
        })
        break
      }
    }
  })

  return decodedRewardClaimedEvents
}

export const getRewardClaimedEventsQueryKey = (cycle?: number, voter?: string) => {
  return ["rewardClaimedEvents", cycle, voter]
}

/**
 * useRewardClaimedEvents is a custom hook that fetches the RewardClaimed events for a given cycle and voter.
 *
 * @param {number} cycle - The cycle of the rewards. If not provided, no queries will be made.
 * @param {string} voter - The address of the voter. If not provided, the rewards for all voters will be fetched.
 * @returns {object} An object containing the status and data of the queries. Refer to the react-query documentation for more details.
 */
export const useRewardClaimedEvents = (cycle?: number, voter?: string) => {
  const { thor } = useConnex()

  const result = useQuery({
    queryKey: getRewardClaimedEventsQueryKey(cycle, voter),
    enabled: !!thor && !!cycle,
    queryFn: async () => {
      return getRewardClaimedEvents(thor, { cycle, voter })
    },
  })
  return result
}
