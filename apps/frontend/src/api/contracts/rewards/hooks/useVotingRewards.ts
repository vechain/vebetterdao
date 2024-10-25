import { useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { getRoundRewardQueryKey } from "./useVotingRoundReward"
import { VoterRewards__factory } from "@repo/contracts"
import { abi } from "thor-devkit"
import { getConfig } from "@repo/config"
import { ethers } from "ethers"
import { BigNumber } from "bignumber.js"
import { useMultiCall } from "@/hooks"

const voterRewardsInterface = VoterRewards__factory.createInterface()
const voteRewardFragment = voterRewardsInterface.getFunction("getReward").format("json")
const getReward = new abi.Function(JSON.parse(voteRewardFragment))

const VOTER_REWARDS_CONTRACT = getConfig().voterRewardsContractAddress

/**
 * useVotingRewards is a custom hook that fetches the voting rewards for a given round and voter.
 * It uses the multi-clause reading to fetch the data in parallel for all rounds up to the current one.
 *
 * @param {string} currentRoundId - The id of the current round. If not provided, no queries will be made.
 * @param {string} voter - The address of the voter. If not provided, the rewards for all voters will be fetched.
 * @returns {object} An object containing the status and data of the queries. Refer to the react-query documentation for more details.
 */
export const useVotingRewards = (currentRoundId?: string, voter?: string) => {
  const queryClient = useQueryClient()

  // Generate an array of round IDs from 1 to currentRoundId - 1
  const rounds = useMemo(() => {
    const totalRounds = parseInt(currentRoundId ?? "0", 10) - 1
    return totalRounds > 0 ? Array.from({ length: totalRounds }, (_, i) => (i + 1).toString()) : []
  }, [currentRoundId])

  // Build clauses for each round
  const clauses = useMemo(() => {
    if (!voter || !VOTER_REWARDS_CONTRACT || rounds.length === 0) return []
    return rounds.map(roundId => ({
      to: VOTER_REWARDS_CONTRACT,
      value: "0x0",
      data: getReward.encode(roundId, voter),
    }))
  }, [rounds, voter])

  // Use the useMultiCall hook to execute the clauses
  const { data: multiCallData, error, isLoading } = useMultiCall(clauses, getRoundRewardQueryKey("ALL", voter))

  // Process the results from multiCallData
  const data = useMemo(() => {
    if (isLoading || error || !multiCallData || multiCallData.reverted) {
      return null
    }

    let total = new BigNumber(0)
    const roundsRewards = multiCallData.results.map((result, index) => {
      const decoded = getReward.decode(result.data)
      const roundId = rounds[index] as string
      const rewards = decoded[0] as string
      const formattedRewards = ethers.formatEther(rewards)

      total = total.plus(rewards)

      // Update the cache for individual round rewards
      queryClient.setQueryData(getRoundRewardQueryKey(roundId, voter), {
        roundId,
        rewards: formattedRewards,
      })

      return {
        roundId,
        rewards,
        formattedRewards,
      }
    })

    const totalFormatted = ethers.formatEther(total.toFixed())

    return {
      total: total.toFixed(),
      totalFormatted,
      roundsRewards,
    }
  }, [multiCallData, error, isLoading, queryClient, rounds, voter])

  // Construct the final error object if any
  const finalError =
    error ||
    (multiCallData?.reverted
      ? new Error(
          `Execution reverted at clause index ${multiCallData.revertInfo?.index}: ${multiCallData.revertInfo?.reason}`,
        )
      : null)

  return {
    isLoading,
    data,
    error: finalError,
  }
}
