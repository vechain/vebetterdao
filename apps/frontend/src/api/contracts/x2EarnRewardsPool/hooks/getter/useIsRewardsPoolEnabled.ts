import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@repo/contracts"

const address = getConfig().x2EarnRewardsPoolContractAddress
const abi = X2EarnRewardsPool__factory.abi
const method = "isRewardsPoolEnabled" as const

/**
 * Returns the query key for checking if rewards pool is enabled.
 * @param xAppId The xApp id
 * @returns The query key for checking if rewards pool is enabled.
 */
export const getIsRewardsPoolEnabledQueryKey = (xAppId: string) =>
  getCallClauseQueryKey<typeof abi>({ address, method, args: [xAppId as `0x${string}`] })

/**
 * Hook to get whether the rewards pool is enabled or not for a specific xApp
 * @param xAppId The xApp id
 * @returns whether the rewards pool is enabled or not for a specific xApp
 */
export const useIsRewardsPoolEnabled = (xAppId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [xAppId as `0x${string}`],
    queryOptions: {
      enabled: !!xAppId,
      select: data => data[0],
    },
  })
}
