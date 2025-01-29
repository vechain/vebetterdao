import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/vechain-kit"

import { getConfig } from "@repo/config"
const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress
import { X2EarnApps__factory as X2EarnApps } from "@repo/contracts"

/**
 * Check if the given address is the moderator of the app
 * @param appId  the id of the app
 * @param address  the address to check
 * @returns a boolean indicating if the address is the moderator of the app
 */
export const getIsAppModerator = async (thor: Connex.Thor, appId: string, address: string): Promise<boolean> => {
  const functionFragment = X2EarnApps.createInterface().getFunction("isAppModerator").format("json")
  const res = await thor.account(X2EARNAPPS_CONTRACT).method(JSON.parse(functionFragment)).call(appId, address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getIsAppModeratorQueryKey = (appId: string, address: string) => ["isAppModerator", appId, address]

/**
 * Check if the given address is the moderator of the app
 * @param appId  the id of the app
 * @param address  the address to check
 * @returns a boolean indicating if the address is the moderator of the app
 */
export const useIsAppModerator = (appId: string, address: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getIsAppModeratorQueryKey(appId, address),
    queryFn: async () => await getIsAppModerator(thor, appId, address),
    enabled: !!thor && !!address && !!appId,
  })
}
