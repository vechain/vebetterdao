import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"

const abi = X2EarnApps__factory.abi
const address = getConfig().x2EarnAppsContractAddress
const method = "appAdmin" as const

export const getAppAdminQueryKey = (appId: string) =>
  getCallClauseQueryKey<typeof abi>({
    address,
    method,
    args: [appId as `0x${string}`],
  })

/**
 *  Get the admin of the app
 * @param appId  the id of the app
 * @returns the admin of the app
 */
export const useAppAdmin = (appId: string) => {
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
