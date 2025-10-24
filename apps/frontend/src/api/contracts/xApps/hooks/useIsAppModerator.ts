import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/X2EarnApps__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const abi = X2EarnApps__factory.abi
const contractAddress = getConfig().x2EarnAppsContractAddress as `0x${string}`
const method = "isAppModerator" as const
export const getIsAppModeratorQueryKey = (appId: string, address: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address: contractAddress as `0x${string}`,
    method,
    args: [appId as `0x${string}`, address as `0x${string}`],
  })
/**
 * Check if the given address is the moderator of the app
 * @param appId  the id of the app
 * @param address  the address to check
 * @returns a boolean indicating if the address is the moderator of the app
 */
export const useIsAppModerator = (appId: string, address: string) => {
  return useCallClause({
    abi,
    address: contractAddress,
    method,
    args: [appId as `0x${string}`, address as `0x${string}`],
    queryOptions: {
      enabled: !!address && !!appId,
      select: data => data[0],
    },
  })
}
