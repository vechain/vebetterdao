import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress
import { X2EarnApps__factory as X2EarnApps } from "@repo/contracts"

/**
 * Check if the given address is the admin of the app
 * @param appId  the id of the app
 * @param address  the address to check
 * @returns a boolean indicating if the address is the admin of the app
 */
export const getIsAppAdmin = async (thor: Connex.Thor, appId: string, address: string): Promise<boolean> => {
  const functionFragment = X2EarnApps.createInterface().getFunction("isAppAdmin").format("json")
  const res = await thor.account(X2EARNAPPS_CONTRACT).method(JSON.parse(functionFragment)).call(appId, address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getIsAppAdminQueryKey = (appId: string, address: string) => ["isAppAdmin", appId, address]

/**
 * Check if the given address is the admin of the app
 * @param appId  the id of the app
 * @param address  the address to check
 * @returns a boolean indicating if the address is the admin of the app
 */
export const useIsAppAdmin = (appId: string, address: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getIsAppAdminQueryKey(appId, address),
    queryFn: async () => await getIsAppAdmin(thor, appId, address),
    enabled: !!thor && !!address && !!appId,
  })
}
