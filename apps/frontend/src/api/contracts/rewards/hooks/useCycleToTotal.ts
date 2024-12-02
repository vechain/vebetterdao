import { VoterRewards__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { getCallKey, useCall } from "@/hooks"
import { ethers } from "ethers"

const method = "cycleToTotal"
const voterRewardsInterface = VoterRewards__factory.createInterface()
const VOTER_REWARDS_CONTRACT = getConfig().voterRewardsContractAddress

/**
 * Returns the query key for fetching the getCycleToTotal
 * * @param {string} cycle - The id of the round.
 * @returns The query key for fetching the getCycleToTotal
 */
export const getCycleToTotal = (address?: string) => {
  return getCallKey({ method, keyArgs: [address] })
}

/**
 * Hook that fetches the total reward-weighted votes given a specific cycle(round)
 *
 * @param {string} cycle - The id of the round. If not provided, no queries will be made.
 * @returns {uint256} A uint256 that represents the total reward-weighted votes in a specific cycle.
 */
export const useCycleToTotal = (cycle?: string) => {
  const res = useCall({
    contractInterface: voterRewardsInterface,
    contractAddress: VOTER_REWARDS_CONTRACT,
    method,
    args: [cycle ?? ""],
    enabled: !!cycle,
  })

  const formattedResult = res.data ? ethers.formatEther(res.data) : null
  return formattedResult
}
