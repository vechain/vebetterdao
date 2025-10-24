import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts"
import { getCallClauseQueryKeyWithArgs, useCallClause } from "@vechain/vechain-kit"

const abi = X2EarnApps__factory.abi
const address = getConfig().x2EarnAppsContractAddress
const method = "rewardDistributors" as const
export const getAppRewardDistributorsQueryKey = (appId: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [appId as `0x${string}`],
  })
/**
 *  Get the reward distributors of the app
 * @param appId  the id of the app to get the reward distributors for
 * @returns  the reward distributors of the app
 */
export const useAppRewardDistributors = (appId: string) => {
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
