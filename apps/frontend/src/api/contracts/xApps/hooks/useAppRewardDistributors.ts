import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/vechain-kit"

import { getConfig } from "@repo/config"
const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress
import { X2EarnApps__factory as X2EarnApps } from "@repo/contracts"

/**
 *  Get the reward distributors of the app
 * @param thor  the thor connection
 * @param appId  the id of the app to get the reward distributors for
 * @returns  the reward distributors of the app
 */
export const getAppRewardDistributors = async (thor: Connex.Thor, appId: string): Promise<string[]> => {
  const functionFragment = X2EarnApps.createInterface().getFunction("rewardDistributors").format("json")
  const res = await thor.account(X2EARNAPPS_CONTRACT).method(JSON.parse(functionFragment)).call(appId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getAppRewardDistributorsQueryKey = (appId: string) => ["xApps", appId, "distributors"]

/**
 *  Get the reward distributors of the app
 * @param appId  the id of the app to get the reward distributors for
 * @returns  the reward distributors of the app
 */
export const useAppRewardDistributors = (appId: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAppRewardDistributorsQueryKey(appId),
    queryFn: async () => await getAppRewardDistributors(thor, appId),
    enabled: !!thor,
  })
}
