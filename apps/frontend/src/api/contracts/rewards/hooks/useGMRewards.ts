import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VoterRewards__factory } from "@repo/contracts/typechain-types"
import { FormattingUtils } from "@repo/utils"
import { formatEther } from "viem"

const address = getConfig().voterRewardsContractAddress
const abi = VoterRewards__factory.abi
const method = "getGMReward" as const

/**
 * Returns the query key for fetching the GM rewards.
 * @returns The query key for fetching the GM rewards.
 */
export const getGMRewardsQueryKey = (currentRoundId?: number, voter?: string) => {
  return getCallClauseQueryKey<typeof abi>({ address, method, args: [BigInt(currentRoundId ?? 0), voter ?? "0x"] })
}

/**
 * Hook to get the GM rewards for a given round and voter.
 * @param currentRoundId The current round id.
 * @param voter The voter address.
 * @returns The GM rewards for the given round and voter. If no GM rewards are found, returns 0.
 */
export const useGMRewards = (currentRoundId?: number, voter?: string) => {
  const { data: gmRewards } = useCallClause({
    abi,
    address,
    method,
    args: [BigInt(currentRoundId ?? 0), voter ?? "0x"],
    queryOptions: {
      select: data => data[0],
      enabled: !!voter && !!currentRoundId,
    },
  })

  const scaled = formatEther(gmRewards ?? BigInt(0))
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  return {
    original: gmRewards,
    scaled,
    formatted,
  }
}
