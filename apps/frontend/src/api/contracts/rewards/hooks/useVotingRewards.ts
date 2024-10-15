import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { getRoundRewardQueryKey } from "./useVotingRoundReward"
import { useAllocationsRoundState } from "../../xAllocations"
import { VoterRewards__factory } from "@repo/contracts"
import { abi } from "thor-devkit"
import { getConfig } from "@repo/config"
import { ethers } from "ethers"
import Bignumber from "bignumber.js"

const b3trGovernorInterface = VoterRewards__factory.createInterface()
const voteRewardFragment = b3trGovernorInterface.getFunction("getReward").format("json")
const getReward = new abi.Function(JSON.parse(voteRewardFragment))

const VOTER_REWARDS_CONTRACT = getConfig().voterRewardsContractAddress
const DECIMAL_PLACES = 4
/**
 * useVotingRewards is a custom hook that fetches the voting rewards for a given round and voter.
 * It uses the mutli-clause reading to fetch the data in parallel for all rounds up to the current one.
 *
 * @param {string} currentRoundId - The id of the current round. If not provided, no queries will be made.
 * @param {string} voter - The address of the voter. If not provided, the rewards for all voters will be fetched.
 * @returns {object} An object containing the status and data of the queries. Refer to the react-query documentation for more details.
 */
export const useVotingRewards = (currentRoundId?: string, voter?: string) => {
  const { thor } = useConnex()
  const queryClient = useQueryClient()
  const { data: state } = useAllocationsRoundState(currentRoundId ?? "")

  // Get array from 1 to currentRoundId - 1 (if currentRoundId is still active)
  const rounds = useMemo(() => {
    return Array.from({ length: parseInt(currentRoundId ?? "0") - (state === 0 ? 1 : 0) }, (_, i) => (i + 1).toString())
  }, [currentRoundId, state])

  return useQuery({
    queryKey: getRoundRewardQueryKey("ALL", voter),
    queryFn: async () => {
      const clauses = rounds.map(roundId => ({
        to: VOTER_REWARDS_CONTRACT,
        value: 0,
        data: getReward.encode(roundId, voter),
      }))

      const res = await thor.explain(clauses).execute()

      let total = 0
      const roundsRewards = res.map((r, index) => {
        const decoded = getReward.decode(r.data)
        const roundId = rounds[index] as string
        const rewards = decoded[0]
        const formattedRewards = ethers.formatEther(rewards)

        total += parseFloat(formattedRewards)

        queryClient.setQueryData(getRoundRewardQueryKey(roundId, voter), state)
        return {
          roundId,
          rewards,
          formattedRewards,
        }
      })

      const totalFormatted = new Bignumber(total).decimalPlaces(DECIMAL_PLACES, Bignumber.ROUND_DOWN).toString()

      return {
        total,
        totalFormatted,
        roundsRewards,
      }
    },
  })
}
