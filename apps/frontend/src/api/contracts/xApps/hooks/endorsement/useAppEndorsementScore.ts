import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain-kit/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().x2EarnAppsContractAddress
const abi = X2EarnApps__factory.abi
const method = "getScore" as const

/**
 * Get the query key the app endorsement score
 */
export const getAppEndorsementScoreQueryKey = (appId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [appId as `0x${string}`] })

/**
 *  Hook to get the endorsement score threshold
 * @returns The endorsement score threshold
 */
export const useAppEndorsementScore = (appId?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [appId as `0x${string}`],
    queryOptions: {
      enabled: !!appId,
      select: data => data[0].toString(),
    },
  })
}
