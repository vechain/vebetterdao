import { ethers } from "ethers"
import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VoterRewards__factory } from "@repo/contracts/typechain-types"
import { FormattingUtils } from "@repo/utils"

const voterRewardsContractAddress = getConfig().voterRewardsContractAddress
const voterRewardsInterface = VoterRewards__factory.createInterface()
const method = "getGMReward"

/**
 * Returns the query key for fetching the GM rewards.
 * @returns The query key for fetching the GM rewards.
 */
export const getGMRewardsQueryKey = (currentRoundId?: number, voter?: string) => {
  return getCallKey({ method, keyArgs: [currentRoundId, voter] })
}

/**
 * Hook to get the GM rewards for a given round and voter.
 * @param currentRoundId The current round id.
 * @param voter The voter address.
 * @returns The GM rewards for the given round and voter. If no GM rewards are found, returns 0.
 */
export const useGMRewards = (currentRoundId?: number, voter?: string) => {
  const { data: gmRewards } = useCall({
    contractInterface: voterRewardsInterface,
    contractAddress: voterRewardsContractAddress,
    method,
    args: [currentRoundId, voter],
    enabled: !!voter && !!currentRoundId,
  })

  const scaled = ethers.formatEther(gmRewards ?? 0)
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  return {
    original: gmRewards,
    scaled,
    formatted,
  }
}
