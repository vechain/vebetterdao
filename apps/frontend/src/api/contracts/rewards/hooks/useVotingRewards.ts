import { getConfig } from "@repo/config"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { VoterRewards__factory } from "@vechain/vebetterdao-contracts/factories/VoterRewards__factory"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"
import { BigNumber } from "bignumber.js"
import { ethers } from "ethers"

import { getRoundRewardQueryKey } from "./useVotingRoundReward"

const abi = VoterRewards__factory.abi
const address = getConfig().voterRewardsContractAddress as `0x${string}`
export const getVotingRewardsQueryKey = (voter: string, lastRound: number) => [`ALL_TO_ROUND_${lastRound}`, voter]
/**
 * useVotingRewards is a custom hook that fetches the voting rewards for a given round and voter.
 * It uses the mutli-clause reading to fetch the data in parallel for all rounds up to the current one.
 *
 * @param {string} voter - The address of the voter. If not provided, the rewards for all voters will be fetched.
 * @returns {object} An object containing the status and data of the queries. Refer to the react-query documentation for more details.
 */
export const useVotingRewards = (currentRoundId: number, voter?: string) => {
  const thor = useThor()
  const queryClient = useQueryClient()
  //Make sure we don't go below 0
  const lastRoundId = Math.max(0, currentRoundId - 1)
  return useQuery({
    queryKey: getVotingRewardsQueryKey(voter || "", lastRoundId),
    enabled: !!thor && !!voter,
    queryFn: async () => {
      // Get array from 1 to lastRoundId (if currentRoundId is still active)
      const rounds = Array.from({ length: lastRoundId }, (_, i) => (i + 1).toString())
      const res = await executeMultipleClausesCall({
        thor,
        calls: rounds.map(
          roundId =>
            ({
              abi,
              address,
              functionName: "getReward",
              args: [roundId, voter],
            }) as const,
        ),
      })
      const resGM = await executeMultipleClausesCall({
        thor,
        calls: rounds.map(
          roundId =>
            ({
              abi,
              address,
              functionName: "getGMReward",
              args: [roundId, voter],
            }) as const,
        ),
      })

      let total = new BigNumber(0)
      let totalGMRewards = new BigNumber(0)

      const roundsRewards = res.map((rewards, index) => {
        const roundId = rounds[index] as string
        const formattedRewards = ethers.formatEther(rewards)

        total = total.plus(rewards)

        queryClient.setQueryData(getRoundRewardQueryKey(roundId, voter || ""), [rewards])

        return {
          roundId,
          rewards: rewards.toString(),
          formattedRewards,
        }
      })

      const roundsRewardsWithGm = resGM.map((gmRewards, index) => {
        const roundId = rounds[index] as string
        const formattedRewardsGM = ethers.formatEther(gmRewards)

        totalGMRewards = totalGMRewards.plus(gmRewards)
        return {
          roundId,
          rewards: gmRewards,
          formattedRewards: formattedRewardsGM,
        }
      })

      const totalFormatted = ethers.formatEther(total.plus(totalGMRewards).toFixed())

      return {
        total: total.toFixed(),
        totalFormatted,
        roundsRewards: roundsRewards,
        roundsRewardsWithGm: roundsRewardsWithGm,
      }
    },
  })
}
