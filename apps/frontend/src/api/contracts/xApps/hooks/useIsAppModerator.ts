import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts/typechain-types"

const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress

/**
 * Check if the given address is the moderator of the app
 * @param thor - The thor client
 * @param appId  the id of the app
 * @param address  the address to check
 * @returns a boolean indicating if the address is the moderator of the app
 */
export const getIsAppModerator = async (thor: ThorClient, appId: string, address: string): Promise<boolean> => {
  const res = await thor.contracts
    .load(X2EARNAPPS_CONTRACT, X2EarnApps__factory.abi)
    .read.isAppModerator(appId, address)

  if (!res) return Promise.reject(new Error("Is app moderator call failed"))

  return res[0] as boolean
}

export const getIsAppModeratorQueryKey = (appId: string, address: string) => ["isAppModerator", appId, address]

/**
 * Check if the given address is the moderator of the app
 * @param appId  the id of the app
 * @param address  the address to check
 * @returns a boolean indicating if the address is the moderator of the app
 */
export const useIsAppModerator = (appId: string, address: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getIsAppModeratorQueryKey(appId, address),
    queryFn: async () => await getIsAppModerator(thor, appId, address),
    enabled: !!thor && !!address && !!appId,
  })
}
