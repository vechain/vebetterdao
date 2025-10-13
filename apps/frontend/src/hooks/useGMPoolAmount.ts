import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { Emissions__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { ethers } from "ethers"

const address = getConfig().emissionsContractAddress as `0x${string}`
const abi = Emissions__factory.abi
const method = "getGMAmount" as const
/**
 * Returns the query key for fetching the GM amount.
 * @returns The query key for fetching the GM amount.
 */
export const getGMFullPoolAmountQueryKey = (currentRoundId?: number) => {
  return getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(currentRoundId || 0)] })
}
/**
 * Hook to get the GM amount for a given round.
 * @param currentRoundId The current round id.
 * @returns The GM amount for the given round. If no GM amount is found, returns 0.
 */
export const useGMPoolAmount = (currentRoundId?: number) => {
  const { data: gmAmountData } = useCallClause({
    abi,
    address,
    method,
    args: [currentRoundId ? BigInt(currentRoundId) : BigInt(0)],
    queryOptions: {
      enabled: !!currentRoundId,
    },
  })
  const gmAmount = gmAmountData?.[0]
  const scaled = ethers.formatEther(BigInt(gmAmount ?? 0))
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)
  return {
    original: gmAmount,
    scaled,
    formatted,
  }
}
