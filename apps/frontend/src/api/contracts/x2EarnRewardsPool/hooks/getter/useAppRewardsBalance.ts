import { useQuery } from "@tanstack/react-query"
import { useThor, TokenBalance } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@repo/contracts/typechain-types"
import { ethers } from "ethers"
import { FormattingUtils } from "@repo/utils"

const X2EARN_REWARDS_POOL_CONTRACT = getConfig().x2EarnRewardsPoolContractAddress

/**
 * Get the rewards balance in the x2Earn rewards pool contract for a specific xApp
 *
 * @param thor - The thor client
 * @param xAppId - The xApp id
 * @returns The rewards balance in the x2Earn rewards pool contract for a specific xApp
 */
export const getAppRewardsBalance = async (thor: ThorClient, xAppId: string): Promise<TokenBalance> => {
  const res = await thor.contracts
    .load(X2EARN_REWARDS_POOL_CONTRACT, X2EarnRewardsPool__factory.abi)
    .read.rewardsPoolBalance(xAppId)

  if (!res) return Promise.reject(new Error("Rewards balance call failed"))

  const original = res[0].toString()
  const scaled = ethers.formatEther(res[0] as bigint)
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  return {
    original,
    scaled,
    formatted,
  }
}

export const getAppRewardsBalanceQueryKey = (xAppId: string) => ["X2EarnRewardsPool", "APP_REWARDS_BALANCE", xAppId]

/**
 * Get the rewards balance in the x2Earn rewards pool contract
 *
 * @param xAppId - The xApp id
 * @returns The rewards balance in the x2Earn rewards pool contract.
 */
export const useAppRewardsBalance = (xAppId: string) => {
  const thor = useThor()
  return useQuery({
    queryKey: getAppRewardsBalanceQueryKey(xAppId),
    queryFn: async () => await getAppRewardsBalance(thor, xAppId),
    enabled: !!thor && !!xAppId,
  })
}
