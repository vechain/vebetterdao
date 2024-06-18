import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@repo/contracts"
import { ethers } from "ethers"

const X2EARN_REWARDS_POOL_CONTRACT = getConfig().x2EarnRewardsPoolContractAddress

/**
 * Get the available balance in the x2Earn rewards pool contract for a specific xApp
 *
 * @param thor  the connex instance
 * @param xAppId  the xApp id
 * @returns the available balance in the x2Earn rewards pool contract for a specific xApp
 */
export const getAppBalance = async (thor: Connex.Thor, xAppId: string): Promise<string> => {
  const functionFragment = X2EarnRewardsPool__factory.createInterface().getFunction("availableFunds").format("json")
  const res = await thor.account(X2EARN_REWARDS_POOL_CONTRACT).method(JSON.parse(functionFragment)).call(xAppId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return ethers.formatEther(res.decoded["0"])
}

export const getAppBalanceQueryKey = (xAppId: string) => ["X2EarnRewardsPool", "APP_BALANCE", xAppId]

/**
 * Get the balance available in the x2Earn rewards pool contract
 *
 * @param thor  the connex instance
 * @param xAppId  the xApp id
 * @returns the balance available in the x2Earn rewards pool contract
 */
export const useAppBalance = (xAppId: string) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getAppBalanceQueryKey(xAppId),
    queryFn: async () => await getAppBalance(thor, xAppId),
    enabled: !!thor && !!xAppId,
  })
}
