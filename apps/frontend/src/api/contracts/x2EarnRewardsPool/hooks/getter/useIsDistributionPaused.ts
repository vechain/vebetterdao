import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@repo/contracts/typechain-types"

const X2EARN_REWARDS_POOL_CONTRACT = getConfig().x2EarnRewardsPoolContractAddress

/**
 * Get the whether the distribution is paused or not for a specific xApp
 *
 * @param thor - The thor client
 * @param xAppId - The xApp id
 * @returns The whether the distribution is paused or not for a specific xApp
 */
export const isDistributionPaused = async (thor: ThorClient, xAppId: string): Promise<boolean> => {
  const res = await thor.contracts
    .load(X2EARN_REWARDS_POOL_CONTRACT, X2EarnRewardsPool__factory.abi)
    .read.isDistributionPaused(xAppId)

  if (!res) return Promise.reject(new Error("Distribution paused call failed"))

  return res[0] as boolean
}

export const getIsDistributionPausedQueryKey = (xAppId: string) => [
  "X2EarnRewardsPool",
  "IS_DISTRIBUTION_PAUSED",
  xAppId,
]

/**
 * Get whether the distribution is paused or not for a specific xApp
 *
 * @param xAppId - The xApp id
 * @returns Whether the distribution is paused or not for a specific xApp
 */
export const useIsDistributionPaused = (xAppId: string) => {
  const thor = useThor()
  return useQuery({
    queryKey: getIsDistributionPausedQueryKey(xAppId),
    queryFn: async () => await isDistributionPaused(thor, xAppId),
    enabled: !!thor && !!xAppId,
  })
}
