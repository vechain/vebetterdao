import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts/typechain-types"

const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress

/**
 *  Get the admin of the app
 * @param thor  the thor connection
 * @param appId  the id of the app
 * @returns  the admin of the app
 */
export const getAppAdmin = async (thor: ThorClient, appId: string): Promise<string> => {
  const res = await thor.contracts.load(X2EARNAPPS_CONTRACT, X2EarnApps__factory.abi).read.appAdmin(appId)

  if (!res) return Promise.reject(new Error("App admin call failed"))

  return res[0] as string
}

export const getAppAdminQueryKey = (appId: string) => ["xApps", appId, "admin"]

/**
 *  Get the admin of the app
 * @param appId  the id of the app
 * @returns the admin of the app
 */
export const useAppAdmin = (appId: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getAppAdminQueryKey(appId),
    queryFn: async () => await getAppAdmin(thor, appId),
    enabled: !!thor && !!appId,
  })
}
