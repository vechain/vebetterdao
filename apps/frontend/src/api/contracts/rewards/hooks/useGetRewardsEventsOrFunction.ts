import { useRewardClaimedEvents } from "./useRewardClaimedEvents"

export type ClaimedReward = {
  claimedReward: number
  claimedGMReward?: number
}

/**
 * useGetRewardsEventsOrFunction is a custom hook that fetches the rewards events or function for a given round and voter.
 * If the rewards are claimed 'useVotingRewards' will return 0, hence, it should return the claimed rewards.
 * If no rewards claimed, nor pending, it will return 0.
 *
 * @param {string} cycle - The id of the round. If not provided, no queries will be made.
 * @param {string} voter - The address of the voter. If not provided, the rewards for all voters will be fetched.
 * @returns {object} An object containing the status and data of the queries. Refer to the react-query documentation for more details.
 */
export const useGetRewardsEventsOrFunction = (voter: string, cycle?: string) => {
  const { data: rewardClaimedEvents } = useRewardClaimedEvents(cycle ? Number(cycle) : 0, voter)

  if (!rewardClaimedEvents) return { claimedReward: 0, claimedGMReward: 0 }

  const claimedReward = rewardClaimedEvents[0]?.reward
  const gmReward = rewardClaimedEvents[0]?.gmReward
  return {
    claimedReward: claimedReward ?? 0,
    claimedGMReward: gmReward ?? 0,
  }
}
