import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VoterRewards__factory } from "@repo/contracts/typechain-types"
import { FormattingUtils } from "@repo/utils"
import { formatEther } from "viem"

const address = getConfig().voterRewardsContractAddress as `0x${string}`
const abi = VoterRewards__factory.abi
const method = "getGMReward" as const

/**
 * Returns the query key for fetching the GM rewards.
 * @returns The query key for fetching the GM rewards.
 */
export const getGMRewardsQueryKey = (roundId: number, userAddress: string) => {
  return getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [BigInt(roundId), userAddress as `0x${string}`],
  })
}

/**
 * Hook to get the GM rewards for a given round and voter.
 * @param currentRoundId The current round id.
 * @param voter The voter address.
 * @returns The GM rewards for the given round and voter. If no GM rewards are found, returns 0.
 */
export const useGMRewards = (currentRoundId?: number, voter?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(currentRoundId ?? 0), (voter ?? "0x") as `0x${string}`],
    queryOptions: {
      select: data => {
        const original = data[0]
        const scaled = formatEther(BigInt(original ?? 0))
        const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)
        return {
          original,
          scaled,
          formatted,
        }
      },
      enabled: !!voter && !!currentRoundId,
    },
  })
}
