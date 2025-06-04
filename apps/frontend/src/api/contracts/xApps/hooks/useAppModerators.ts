import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts/typechain-types"

const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress

/**
 *  Get the moderators of the app
 * @param thor  the thor connection
 * @param appId  the id of the app to get the moderators for
 * @returns  the moderators of the app
 */
export const getAppModerators = async (thor: ThorClient, appId: string): Promise<string[]> => {
  const res = await thor.contracts.load(X2EARNAPPS_CONTRACT, X2EarnApps__factory.abi).read.appModerators(appId)

  if (!res) return Promise.reject(new Error("App moderators call failed"))

  return res[0] as string[]
}

export const getAppModeratorsQueryKey = (appId: string) => ["xApps", appId, "moderators"]

/**
 *  Get the moderators of the app
 * @param appId  the id of the app to get the moderators for
 * @returns  the moderators of the app
 */
export const useAppModerators = (appId: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getAppModeratorsQueryKey(appId),
    queryFn: async () => await getAppModerators(thor, appId),
    enabled: !!thor && !!appId,
  })
}
