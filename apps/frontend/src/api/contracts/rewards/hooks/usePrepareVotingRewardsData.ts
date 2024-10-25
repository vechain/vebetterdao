import { ethers } from "ethers"
import { UseQueryResult } from "@tanstack/react-query"
import { RoundReward } from "../utils"
import { useMemo } from "react"
import { BigNumber } from "bignumber.js"

/**
 * Custom hook to prepare voting rewards data.
 *
 * @param {UseQueryResult<RoundReward, Error>[]} roundsRewards - Array of query results containing round rewards data.
 * @returns {Object} An object containing:
 * - `total`: The total rewards as a string.
 * - `totalFormatted`: The total rewards formatted to two decimal places.
 * - `roundsRewards`: An array of round rewards with formatted rewards.
 */
export const usePrepareVotingRewardsData = (roundsRewards: UseQueryResult<RoundReward, Error>[]) => {
  const roundRewardsWithFormattedRewards = useMemo(() => {
    if (!roundsRewards) return []

    return roundsRewards.map(reward => {
      const formattedRewards = ethers.formatEther(reward.data?.rewards ?? "0")
      return {
        roundId: reward.data?.roundId ?? "",
        rewards: reward.data?.rewards ?? "0",
        formattedRewards,
      }
    })
  }, [roundsRewards])

  const total = useMemo(() => {
    let _total = new BigNumber(0)
    roundRewardsWithFormattedRewards.forEach(reward => {
      const rewardBN = new BigNumber(reward.rewards)
      _total = _total.plus(rewardBN)
    })

    return _total
  }, [roundRewardsWithFormattedRewards])

  const totalFormatted = useMemo(() => {
    return ethers.formatEther(total.toFixed())
  }, [total])

  return {
    total: total.toFixed(),
    totalFormatted,
    roundsRewards: roundRewardsWithFormattedRewards,
  }
}
