import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain-kit/vebetterdao-contracts"

const address = getConfig().x2EarnAppsContractAddress
const abi = X2EarnApps__factory.abi
const method = "appExists" as const

/**
 * Get the query key for a boolean value indicating if the app exists
 * @param appId the app id
 */
export const getAppExistsQueryKey = (appId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [appId as `0x${string}`] })

/**
 * Hook to get a boolean value indicating if the app exists
 * @param appId the app id
 * @returns a boolean value, true for apps that have been included in at least one allocation round
 */
export const useAppExists = (appId: string) => {
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
