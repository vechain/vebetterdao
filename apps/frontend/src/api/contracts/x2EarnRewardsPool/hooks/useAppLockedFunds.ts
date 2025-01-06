import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@repo/contracts"

const X2EARN_REWARDS_POOL_CONTRACT = getConfig().x2EarnRewardsPoolContractAddress
const X2EarnRewardsPoolInterface = X2EarnRewardsPool__factory.createInterface()

/**
 * Returns the query key for fetching the locked funds.
 * @param appId - The xApp id.
 * @returns The query key for fetching the locked funds.
 */
export const getAppLockedFundsQueryKey = (appId?: string) => {
  return getCallKey({ method: "lockedFunds", keyArgs: [appId] })
}

/**
 * Get the founds locked in the x2Earn rewards pool contract for a specific xApp
 *
 * @param thor  the connex instance
 * @param xAppId  the xApp id
 * @returns the founds locked in the x2Earn rewards pool contract for a specific xApp
 */
export const useAppLockedFunds = (appId: string) => {
  return useCall({
    contractInterface: X2EarnRewardsPoolInterface,
    contractAddress: X2EARN_REWARDS_POOL_CONTRACT,
    method: "lockedFunds",
    args: [appId],
  })
}
