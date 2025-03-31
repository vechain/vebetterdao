import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@repo/contracts"

const X2EARN_REWARDS_POOL_CONTRACT = getConfig().x2EarnRewardsPoolContractAddress

/**
 * Get the whether the rewards pool is enabled or not for a specific xApp
 *
 * @param thor  the connex instance
 * @param xAppId  the xApp id
 * @returns the whether the rewards pool is enabled or not for a specific xApp
 */
export const isRewardsPoolEnabled = async (thor: Connex.Thor, xAppId: string): Promise<boolean> => {
  const functionFragment = X2EarnRewardsPool__factory.createInterface()
    .getFunction("isRewardsPoolEnabled")
    .format("json")
  const res = await thor.account(X2EARN_REWARDS_POOL_CONTRACT).method(JSON.parse(functionFragment)).call(xAppId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getIsRewardsPoolEnabledQueryKey = (xAppId: string) => [
  "X2EarnRewardsPool",
  "IS_REWARDS_POOL_ENABLED",
  xAppId,
]

/**
 * Get whether the rewards pool is enabled or not for a specific xApp
 *
 * @param thor  the connex instance
 * @param xAppId  the xApp id
 * @returns whether the rewards pool is enabled or not for a specific xApp
 */
export const useIsRewardsPoolEnabled = (xAppId: string) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getIsRewardsPoolEnabledQueryKey(xAppId),
    queryFn: async () => await isRewardsPoolEnabled(thor, xAppId),
    enabled: !!thor && !!xAppId,
  })
}
