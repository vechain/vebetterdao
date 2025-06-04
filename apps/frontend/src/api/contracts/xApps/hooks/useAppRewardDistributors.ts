import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts/typechain-types"

const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress

/**
 *  Get the reward distributors of the app
 * @param thor  the thor connection
 * @param appId  the id of the app to get the reward distributors for
 * @returns  the reward distributors of the app
 */
export const getAppRewardDistributors = async (thor: ThorClient, appId: string): Promise<string[]> => {
  const res = await thor.contracts.load(X2EARNAPPS_CONTRACT, X2EarnApps__factory.abi).read.rewardDistributors(appId)

  if (!res) return Promise.reject(new Error("App reward distributors call failed"))

  return res[0] as string[]
}

export const getAppRewardDistributorsQueryKey = (appId: string) => ["xApps", appId, "distributors"]

/**
 *  Get the reward distributors of the app
 * @param appId  the id of the app to get the reward distributors for
 * @returns  the reward distributors of the app
 */
export const useAppRewardDistributors = (appId: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getAppRewardDistributorsQueryKey(appId),
    queryFn: async () => await getAppRewardDistributors(thor, appId),
    enabled: !!thor && !!appId,
  })
}
