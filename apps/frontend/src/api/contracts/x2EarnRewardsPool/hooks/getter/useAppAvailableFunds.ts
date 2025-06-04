import { useQuery } from "@tanstack/react-query"
import { useThor, TokenBalance } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@repo/contracts/typechain-types"
import { ethers } from "ethers"
import { FormattingUtils } from "@repo/utils"

const X2EARN_REWARDS_POOL_CONTRACT = getConfig().x2EarnRewardsPoolContractAddress

/**
 * Get the available funds to withdraw in the x2Earn rewards pool contract for a specific xApp
 *
 * @param thor - The thor client
 * @param xAppId - The xApp id
 * @returns The available funds to withdraw in the x2Earn rewards pool contract for a specific xApp
 */
export const getAppAvailableFunds = async (thor: ThorClient, xAppId: string): Promise<TokenBalance> => {
  const res = await thor.contracts
    .load(X2EARN_REWARDS_POOL_CONTRACT, X2EarnRewardsPool__factory.abi)
    .read.availableFunds(xAppId)

  if (!res) return Promise.reject(new Error("Available funds call failed"))

  const original = res[0].toString()
  const scaled = ethers.formatEther(res[0] as bigint)
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  return {
    original,
    scaled,
    formatted,
  }
}

export const getAppAvailableFundsQueryKey = (xAppId: string) => ["X2EarnRewardsPool", "APP_AVAILABLE_FUNDS", xAppId]

/**
 * Get the available funds to withdraw in the x2Earn rewards pool contract
 *
 * @param xAppId - The xApp id
 * @returns The available funds to withdraw in the x2Earn rewards pool contract.
 */
export const useAppAvailableFunds = (xAppId: string) => {
  const thor = useThor()
  return useQuery({
    queryKey: getAppAvailableFundsQueryKey(xAppId),
    queryFn: async () => await getAppAvailableFunds(thor, xAppId),
    enabled: !!thor && !!xAppId,
  })
}
