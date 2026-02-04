import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/x-2-earn-apps/X2EarnApps__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().x2EarnAppsContractAddress as `0x${string}`
const abi = X2EarnApps__factory.abi
const method = "isAppAdmin" as const
/**
 * Returns the query key for checking if an address is app admin.
 * @param appId The id of the app
 * @param userAddress The address to check
 * @returns The query key for checking if an address is app admin.
 */
export const getIsAppAdminQueryKey = (appId: string, userAddress: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [appId as `0x${string}`, (userAddress ?? "0x") as `0x${string}`],
  })
/**
 * Hook to check if the given address is the admin of the app
 * @param appId The id of the app
 * @param userAddress The address to check
 * @returns a boolean indicating if the address is the admin of the app
 */
export const useIsAppAdmin = (appId: string, userAddress: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [appId as `0x${string}`, (userAddress ?? "0x") as `0x${string}`],
    queryOptions: {
      enabled: !!appId && !!userAddress,
      select: data => data[0],
    },
  })
}
