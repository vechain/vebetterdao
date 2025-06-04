import { getConfig } from "@repo/config"
import { VoterRewards__factory } from "@repo/contracts/typechain-types"
import { getAllEventLogs, ThorClient, useThor } from "@vechain/vechain-kit"
import { FilterCriteria } from "@vechain/sdk-network"
import { EnvConfig } from "@repo/config/contracts"
import { useQuery } from "@tanstack/react-query"
import { ethers } from "ethers"

export type RewardClaimed = {
  cycle: number
  voter: string
  reward: number
  gmReward?: number
}

/**
 * Fetches all RewardClaimed events
 * @param {ThorClient} thor - The thor client
 * @param {EnvConfig} env - The environment config
 * @param {object} filterOptions - Filter options for cycle and voter
 * @returns {Promise<RewardClaimed[]>}
 */
export const getRewardClaimedEvents = async (
  thor: ThorClient,
  env: EnvConfig,
  filterOptions?: { cycle?: number; voter?: string },
): Promise<RewardClaimed[]> => {
  const voterRewardsContractAddress = getConfig(env).voterRewardsContractAddress

  const rewardClaimedEventAbi = thor.contracts
    .load(voterRewardsContractAddress, VoterRewards__factory.abi)
    .getEventAbi("RewardClaimed")

  const rewardClaimedV2EventAbi = thor.contracts
    .load(voterRewardsContractAddress, VoterRewards__factory.abi)
    .getEventAbi("RewardClaimedV2")

  const rewardClaimedTopics = rewardClaimedEventAbi.encodeFilterTopicsNoNull({
    cycle: filterOptions?.cycle ?? undefined,
    voter: filterOptions?.voter ?? undefined,
  })

  const rewardClaimedV2Topics = rewardClaimedV2EventAbi.encodeFilterTopicsNoNull({
    cycle: filterOptions?.cycle ?? undefined,
    voter: filterOptions?.voter ?? undefined,
  })

  const filterCriteria: FilterCriteria[] = [
    {
      criteria: {
        address: voterRewardsContractAddress,
        topic0: rewardClaimedTopics[0] ?? undefined,
        topic1: rewardClaimedTopics[1] ?? undefined,
        topic2: rewardClaimedTopics[2] ?? undefined,
        topic3: rewardClaimedTopics[3] ?? undefined,
        topic4: rewardClaimedTopics[4] ?? undefined,
      },
      eventAbi: rewardClaimedEventAbi,
    },
    {
      criteria: {
        address: voterRewardsContractAddress,
        topic0: rewardClaimedV2Topics[0] ?? undefined,
        topic1: rewardClaimedV2Topics[1] ?? undefined,
        topic2: rewardClaimedV2Topics[2] ?? undefined,
        topic3: rewardClaimedV2Topics[3] ?? undefined,
        topic4: rewardClaimedV2Topics[4] ?? undefined,
      },
      eventAbi: rewardClaimedV2EventAbi,
    },
  ]

  const events = await getAllEventLogs({
    nodeUrl: thor.httpClient.baseURL,
    thor,
    from: 0,
    to: undefined,
    filterCriteria,
  })

  const decodedRewardClaimedEvents: RewardClaimed[] = []

  events.forEach(event => {
    if (!event.decodedData) {
      throw new Error("Event data not decoded")
    }

    switch (event.topics[0]) {
      case rewardClaimedTopics[0]: {
        const [cycle, voter, reward] = event.decodedData as [bigint, string, bigint]
        const rewardFormatted = Number(ethers.formatEther(reward))

        decodedRewardClaimedEvents.push({
          cycle: Number(cycle),
          voter,
          reward: rewardFormatted,
        })
        break
      }
      case rewardClaimedV2Topics[0]: {
        const [cycle, voter, reward, gmReward] = event.decodedData as [bigint, string, bigint, bigint]
        const rewardFormatted = Number(ethers.formatEther(reward))
        const gmRewardFormatted = Number(ethers.formatEther(gmReward))

        decodedRewardClaimedEvents.push({
          cycle: Number(cycle),
          voter,
          reward: rewardFormatted,
          gmReward: gmRewardFormatted,
        })
        break
      }
    }
  })

  return decodedRewardClaimedEvents
}

export const getRewardClaimedEventsQueryKey = (env: EnvConfig, cycle?: number, voter?: string) => {
  return ["rewardClaimedEvents", env, cycle, voter]
}

/**
 * useRewardClaimedEvents is a custom hook that fetches the RewardClaimed events for a given cycle and voter.
 *
 * @param {EnvConfig} env - The environment config
 * @param {number} cycle - The cycle of the rewards. If not provided, no queries will be made.
 * @param {string} voter - The address of the voter. If not provided, the rewards for all voters will be fetched.
 * @returns {object} An object containing the status and data of the queries. Refer to the react-query documentation for more details.
 */
export const useRewardClaimedEvents = (env: EnvConfig, cycle?: number, voter?: string) => {
  const thor = useThor()

  const result = useQuery({
    queryKey: getRewardClaimedEventsQueryKey(env, cycle, voter),
    enabled: !!thor && !!cycle,
    queryFn: async () => {
      if (!thor) throw new Error("Thor client not available")
      return getRewardClaimedEvents(thor, env, { cycle, voter })
    },
  })
  return result
}
