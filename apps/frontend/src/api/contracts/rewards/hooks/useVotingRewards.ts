import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { getRoundRewardQueryKey } from "./useVotingRoundReward"
import { getConfig } from "@repo/config"
import { ethers } from "ethers"
import { BigNumber } from "bignumber.js"
import { EnvConfig } from "@repo/config/contracts"

// Function selectors for VoterRewards contract
const getRewardSelector = ethers.id("getReward(uint256,address)").slice(0, 10)
const getGMRewardSelector = ethers.id("getGMReward(uint256,address)").slice(0, 10)

/**
 * useVotingRewards is a custom hook that fetches the voting rewards for a given round and voter.
 * It uses the multi-clause reading to fetch the data in parallel for all rounds up to the current one.
 *
 * @param env - The environment config
 * @param currentRoundId - The current round ID
 * @param voter - The address of the voter. If not provided, the rewards for all voters will be fetched.
 * @returns An object containing the status and data of the queries. Refer to the react-query documentation for more details.
 */
export const useVotingRewards = (env: EnvConfig, currentRoundId: number, voter?: string) => {
  const thor = useThor()
  const queryClient = useQueryClient()

  //Make sure we don't go below 0
  const lastRoundId = Math.max(0, currentRoundId - 1)

  return useQuery({
    queryKey: getRoundRewardQueryKey(`ALL_TO_ROUND_${lastRoundId}`, voter),
    enabled: !!thor && !!voter,
    queryFn: async () => {
      const voterRewardsContractAddress = getConfig(env).voterRewardsContractAddress

      // Get array from 1 to lastRoundId (if currentRoundId is still active)
      const rounds = Array.from({ length: lastRoundId }, (_, i) => (i + 1).toString())

      const clausesVotingRewards = rounds.map(roundId => ({
        to: voterRewardsContractAddress,
        value: "0x0",
        data:
          getRewardSelector +
          ethers.AbiCoder.defaultAbiCoder().encode(["uint256", "address"], [roundId, voter]).slice(2),
      }))

      const clausesGMRewards = rounds.map(roundId => ({
        to: voterRewardsContractAddress,
        value: "0x0",
        data:
          getGMRewardSelector +
          ethers.AbiCoder.defaultAbiCoder().encode(["uint256", "address"], [roundId, voter]).slice(2),
      }))

      const res = await thor.transactions.simulateTransaction(clausesVotingRewards)
      const resGM = await thor.transactions.simulateTransaction(clausesGMRewards)

      let total = new BigNumber(0)
      let totalGMRewards = new BigNumber(0)

      const roundsRewards = res.map((r, index) => {
        if (r.reverted) throw new Error(`Clause ${index + 1} reverted`)

        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], r.data)
        const roundId = rounds[index] as string
        const rewards = decoded[0].toString()
        const formattedRewards = ethers.formatEther(rewards)

        total = total.plus(rewards)

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

      const roundsRewardsWithGm = resGM.map((r, index) => {
        if (r.reverted) throw new Error(`Clause ${index + 1} reverted`)

        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], r.data)
        const roundId = rounds[index] as string
        const gmRewards = decoded[0].toString()
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
