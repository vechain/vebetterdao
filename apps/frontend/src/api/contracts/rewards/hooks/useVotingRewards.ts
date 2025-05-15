import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getRoundRewardQueryKey } from "./useVotingRoundReward"
import { VoterRewards__factory } from "@repo/contracts"
import { abi } from "thor-devkit"
import { getConfig } from "@repo/config"
import { ethers } from "ethers"
import { BigNumber } from "bignumber.js"

const voterRewardsInterface = VoterRewards__factory.createInterface()
const voteRewardFragment = voterRewardsInterface.getFunction("getReward").format("json")
const getReward = new abi.Function(JSON.parse(voteRewardFragment))

const voterGmRewardFragment = voterRewardsInterface.getFunction("getGMReward").format("json")
const getGMReward = new abi.Function(JSON.parse(voterGmRewardFragment))

const VOTER_REWARDS_CONTRACT = getConfig().voterRewardsContractAddress
/**
 * useVotingRewards is a custom hook that fetches the voting rewards for a given round and voter.
 * It uses the mutli-clause reading to fetch the data in parallel for all rounds up to the current one.
 *
 * @param {string} voter - The address of the voter. If not provided, the rewards for all voters will be fetched.
 * @returns {object} An object containing the status and data of the queries. Refer to the react-query documentation for more details.
 */
export const useVotingRewards = (currentRoundId: number, voter?: string) => {
  const { thor } = useConnex()
  const queryClient = useQueryClient()

  //Make sure we don't go below 0
  const lastRoundId = Math.max(0, currentRoundId - 1)

  return useQuery({
    queryKey: getRoundRewardQueryKey(`ALL_TO_ROUND_${lastRoundId}`, voter),
    enabled: !!thor && !!voter,
    queryFn: async () => {
      // Get array from 1 to lastRoundId (if currentRoundId is still active)
      const rounds = Array.from({ length: lastRoundId }, (_, i) => (i + 1).toString())
      const clausesVotingRewards = rounds.map(roundId => ({
        to: VOTER_REWARDS_CONTRACT,
        value: "0x0",
        data: getReward.encode(roundId, voter),
      }))

      const clausesGMRewards = rounds.map(roundId => ({
        to: VOTER_REWARDS_CONTRACT,
        value: "0x0",
        data: getGMReward.encode(roundId, voter),
      }))

      const res = await thor.explain(clausesVotingRewards).execute()
      const resGM = await thor.explain(clausesGMRewards).execute()

      let total = new BigNumber(0)
      let totalGMRewards = new BigNumber(0)

      const roundsRewards = res.map((r, index) => {
        const decoded = getReward.decode(r.data)
        if (r.reverted) throw new Error(`Clause ${index + 1} reverted with reason ${r.revertReason}`)
        const roundId = rounds[index] as string
        const rewards = decoded[0] as string
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
        const decoded = getGMReward.decode(r.data)
        if (r.reverted) throw new Error(`Clause ${index + 1} reverted with reason ${r.revertReason}`)
        const roundId = rounds[index] as string
        const gmRewards = decoded[0] as string
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
