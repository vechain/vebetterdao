import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@repo/contracts"
import { ethers } from "ethers"
import { FormattingUtils } from "@repo/utils"
import { TokenBalance } from "../../b3tr"

const X2EARN_REWARDS_POOL_CONTRACT = getConfig().x2EarnRewardsPoolContractAddress

/**
 * Get the rewards balance in the x2Earn rewards pool contract for a specific xApp
 *
 * @param thor  the connex instance
 * @param xAppId  the xApp id
 * @returns the rewards balance in the x2Earn rewards pool contract for a specific xApp
 */
export const getAppRewardsBalance = async (thor: Connex.Thor, xAppId: string): Promise<TokenBalance> => {
  const functionFragment = X2EarnRewardsPool__factory.createInterface().getFunction("rewardsPoolBalance").format("json")
  const res = await thor.account(X2EARN_REWARDS_POOL_CONTRACT).method(JSON.parse(functionFragment)).call(xAppId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  const original = res.decoded[0]
  const scaled = ethers.formatEther(original)
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
 * @param thor  the connex instance
 * @param xAppId  the xApp id
 * @returns the rewards balance in the x2Earn rewards pool contract.
 */
export const useAppRewardsBalance = (xAppId: string) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getAppRewardsBalanceQueryKey(xAppId),
    queryFn: async () => await getAppRewardsBalance(thor, xAppId),
    enabled: !!thor && !!xAppId,
  })
}
