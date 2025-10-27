import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/X2EarnApps__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().x2EarnAppsContractAddress
const abi = X2EarnApps__factory.abi
const method = "getEndorsers" as const
/**
 * Get the query key for the list of endorsers for an app
 */
export const getEndorsersQueryKey = (appId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [appId as `0x${string}`] })
/**
 *  Hook to get the list of endorsers for an app
 * @returns The endorsers for an app
 */
export const useAppEndorsers = (appId?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [appId as `0x${string}`],
    queryOptions: {
      enabled: !!appId,
      select: data => [...data[0]],
    },
  })
}
