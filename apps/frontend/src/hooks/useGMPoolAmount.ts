import { ethers } from "ethers"
import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { Emissions__factory } from "@repo/contracts/typechain-types"
import { FormattingUtils } from "@repo/utils"

const emissionsContractAddress = getConfig().emissionsContractAddress
const emissionsInterface = Emissions__factory.createInterface()
const method = "getGMAmount"

/**
 * Returns the query key for fetching the GM amount.
 * @returns The query key for fetching the GM amount.
 */
export const getGMPoolAmountQueryKey = (currentRoundId: number) => {
  return getCallKey({ method, keyArgs: [currentRoundId] })
}

/**
 * Hook to get the GM amount for a given round.
 * @param currentRoundId The current round id.
 * @returns The GM amount for the given round. If no GM amount is found, returns 0.
 */
export const useGMPoolAmount = (currentRoundId?: number) => {
  const { data: gmAmount } = useCall({
    contractInterface: emissionsInterface,
    contractAddress: emissionsContractAddress,
    method,
    args: [currentRoundId],
    enabled: !!currentRoundId,
  })

  const scaled = ethers.formatEther(gmAmount ?? 0)
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  return {
    original: gmAmount,
    scaled,
    formatted,
  }
}
