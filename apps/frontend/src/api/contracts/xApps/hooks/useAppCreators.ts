import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/X2EarnApps__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const abi = X2EarnApps__factory.abi
const address = getConfig().x2EarnAppsContractAddress
const method = "appCreators" as const
export const getAppCreatorsQueryKey = (appId: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [appId as `0x${string}`],
  })
/**
 *  Get the creators of the app
 * @param appId  the id of the app to get the creators for
 * @returns  the creators of the app
 */
export const useAppCreators = (appId: string) => {
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
