import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts"

const abi = X2EarnApps__factory.abi
const address = getConfig().x2EarnAppsContractAddress
const method = "appModerators" as const

export const getAppModeratorsQueryKey = (appId: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [appId as `0x${string}`],
  })

/**
 *  Get the moderators of the app
 * @param appId  the id of the app to get the moderators for
 * @returns  the moderators of the app
 */
export const useAppModerators = (appId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [appId as `0x${string}`],
    queryOptions: {
      select: data => data[0],
    },
  })
}
