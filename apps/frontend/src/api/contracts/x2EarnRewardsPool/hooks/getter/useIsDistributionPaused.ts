import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const abi = X2EarnRewardsPool__factory.abi
const address = getConfig().x2EarnRewardsPoolContractAddress
const method = "isDistributionPaused" as const
export const getIsDistributionPausedQueryKey = (xAppId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [xAppId as `0x${string}`] })
/**
 * Get whether the distribution is paused or not for a specific xApp
 *
 * @param xAppId  the xApp id
 * @returns whether the distribution is paused or not for a specific xApp
 */
export const useIsDistributionPaused = (xAppId: string) => {
  return useCallClause({
    address,
    abi,
    method,
    args: [xAppId as `0x${string}`],
    queryOptions: {
      enabled: !!xAppId,
      select: data => data[0],
    },
  })
}
