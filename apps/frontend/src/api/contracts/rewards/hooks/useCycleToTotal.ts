import { VoterRewards__factory } from "@repo/contracts"
// import { abi } from "thor-devkit"
import { getConfig } from "@repo/config"

import { getCallKey, useCall } from "@/hooks"

const method = "cycleToTotal"

const voterRewardsInterface = VoterRewards__factory.createInterface()
// const voteRewardFragment = voterRewardsInterface.getFunction("cycleToTotal").format("json")
// const getReward = new abi.Function(JSON.parse(voteRewardFragment))

const VOTER_REWARDS_CONTRACT = getConfig().voterRewardsContractAddress

/**
 * Returns the query key for fetching the getCycleToTotal
 * * @param {string} cycle - The id of the round.
 * @returns The query key for fetching the getCycleToTotal
 */
export const getCycleToTotal = (cycle?: string) => {
  return getCallKey({ method, keyArgs: [cycle] })
}

/**
 * Hook that fetches the total reward-weighted votes given a specific cycle(round)
 *
 * @param {string} cycle - The id of the round. If not provided, no queries will be made.
 * @returns {uint256} A uint256 that represents the total reward-weighted votes in a specific cycle.
 */
export const useCycleToTotal = (cycle?: string) => {
  return useCall({
    contractInterface: voterRewardsInterface,
    contractAddress: VOTER_REWARDS_CONTRACT,
    method,
    args: [cycle ?? ""],
    enabled: !!cycle,
  })
}
