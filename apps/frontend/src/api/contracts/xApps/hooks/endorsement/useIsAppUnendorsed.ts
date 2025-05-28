import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"

const address = getConfig().x2EarnAppsContractAddress
const abi = X2EarnApps__factory.abi
const method = "isAppUnendorsed" as const

/**
 * Get the query key for a boolean value indicating if the app is unendorsed
 * @param appId  the app id
 */
export const getIsAppUnendorsedQueryKey = (appId: string) =>
  getCallClauseQueryKey<typeof abi>({ address, method, args: [appId] })

/**
 *  Hook to get a boolean value indicating if the app is unendorsed
 * @param appId  the app id
 * @returns a boolean value indicating if the app is unendorsed
 */
export const useIsAppUnendorsed = (appId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [appId as `0x${string}`],
    queryOptions: {
      enabled: !!appId,
      select: data => data[0],
    },
  })
}
