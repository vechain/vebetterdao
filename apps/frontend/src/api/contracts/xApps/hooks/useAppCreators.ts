import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts/typechain-types"

const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress

/**
 *  Get the creators of the app
 * @param thor  the thor connection
 * @param appId  the id of the app to get the creators for
 * @returns  the creators of the app
 */
export const getAppCreators = async (thor: ThorClient, appId: string): Promise<string[]> => {
  const res = await thor.contracts.load(X2EARNAPPS_CONTRACT, X2EarnApps__factory.abi).read.appCreators(appId)

  if (!res) return Promise.reject(new Error("App creators call failed"))

  return res[0] as string[]
}

export const getAppCreatorsQueryKey = (appId: string) => ["xApps", appId, "creators"]

/**
 *  Get the creators of the app
 * @param appId  the id of the app to get the creators for
 * @returns  the creators of the app
 */
export const useAppCreators = (appId: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getAppCreatorsQueryKey(appId),
    queryFn: async () => await getAppCreators(thor, appId),
    enabled: !!thor && !!appId,
  })
}
