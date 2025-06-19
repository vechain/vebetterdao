import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"

const abi = X2EarnApps__factory.abi
const address = getConfig().x2EarnAppsContractAddress
const method = "appCreators" as const

export const getAppCreatorsQueryKey = (appId: string) =>
  getCallClauseQueryKey<typeof abi>({
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
