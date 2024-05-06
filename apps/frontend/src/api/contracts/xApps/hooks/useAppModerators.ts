import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress
import { X2EarnApps__factory as X2EarnApps } from "@repo/contracts"

/**
 *  Get the moderators of the app
 * @param thor  the thor connection
 * @param appId  the id of the app to get the moderators for
 * @returns  the moderators of the app
 */
export const getAppModerators = async (thor: Connex.Thor, appId: string): Promise<string[]> => {
  const functionFragment = X2EarnApps.createInterface().getFunction("appModerators").format("json")
  const res = await thor.account(X2EARNAPPS_CONTRACT).method(JSON.parse(functionFragment)).call(appId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getAppModeratorsQueryKey = (appId: string) => ["xApps", appId, "moderators"]

/**
 *  Get the moderators of the app
 * @param appId  the id of the app to get the moderators for
 * @returns  the moderators of the app
 */
export const useAppModerators = (appId: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAppModeratorsQueryKey(appId),
    queryFn: async () => await getAppModerators(thor, appId),
    enabled: !!thor,
  })
}
