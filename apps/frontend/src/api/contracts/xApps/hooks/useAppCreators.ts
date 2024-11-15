import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress
import { X2EarnApps__factory as X2EarnApps } from "@repo/contracts"

/**
 *  Get the creators of the app
 * @param thor  the thor connection
 * @param appId  the id of the app to get the creators for
 * @returns  the creators of the app
 */
export const getAppCreators = async (thor: Connex.Thor, appId: string): Promise<string[]> => {
  const functionFragment = X2EarnApps.createInterface().getFunction("appCreators").format("json")
  const res = await thor.account(X2EARNAPPS_CONTRACT).method(JSON.parse(functionFragment)).call(appId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getAppCreatorsQueryKey = (appId: string) => ["xApps", appId, "creators"]

/**
 *  Get the creators of the app
 * @param appId  the id of the app to get the creators for
 * @returns  the creators of the app
 */
export const useAppCreators = (appId: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAppCreatorsQueryKey(appId),
    queryFn: async () => await getAppCreators(thor, appId),
    enabled: !!thor,
  })
}
