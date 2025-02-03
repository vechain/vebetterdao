import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@repo/contracts"

const X2EARN_REWARDS_POOL_CONTRACT = getConfig().x2EarnRewardsPoolContractAddress
const X2EarnRewardsPoolInterface = X2EarnRewardsPool__factory.createInterface()

/**
 * Returns the query key for fetching the locked treasury.
 * @param appId - The xApp id.
 */
export const getAppLockedTreasuryQueryKey = (appId?: string) => {
  return getCallKey({ method: "treasuryLocked", keyArgs: [appId] })
}

/**
 * Get the locked treasury of an app in the x2Earn rewards pool contract for a specific xApp
 *
 * @param thor  the connex instance
 * @param xAppId  the xApp id
 * @returns the locked treasury of an app in the x2Earn rewards pool contract for a specific xApp
 */
export const useAppLockedTreasury = (appId: string) => {
  return useCall({
    contractInterface: X2EarnRewardsPoolInterface,
    contractAddress: X2EARN_REWARDS_POOL_CONTRACT,
    method: "treasuryLocked",
    args: [appId],
    enabled: !!appId,
  })
}
