import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress
import { X2EarnApps__factory as X2EarnApps } from "@repo/contracts"

/**
 *  Get the admin of the app
 * @param thor  the thor connection
 * @param appId  the id of the app
 * @returns  the admin of the app
 */
export const getAppAdmin = async (thor: Connex.Thor, appId: string): Promise<string> => {
  const functionFragment = X2EarnApps.createInterface().getFunction("appAdmin").format("json")
  const res = await thor.account(X2EARNAPPS_CONTRACT).method(JSON.parse(functionFragment)).call(appId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getAppAdminQueryKey = (appId: string) => ["xApps", appId, "admin"]

/**
 *  Get the admin of the app
 * @param appId  the id of the app
 * @returns the admin of the app
 */
export const useAppAdmin = (appId: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAppAdminQueryKey(appId),
    queryFn: async () => await getAppAdmin(thor, appId),
    enabled: !!thor,
  })
}
