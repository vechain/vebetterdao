import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@repo/contracts"

const X2EARN_REWARDS_POOL_CONTRACT = getConfig().x2EarnRewardsPoolContractAddress
const X2EarnRewardsPoolInterface = X2EarnRewardsPool__factory.createInterface()

/**
 * Returns the query key for fetching the allowance (available funds - locked funds).
 * @param appId - The xApp id.
 * @returns The query key for fetching the allowance.
 */
export const getAppAllowanceQueryKey = (appId?: string) => {
  return getCallKey({ method: "allowance", keyArgs: [appId] })
}

/**
 * Get the allowance in the x2Earn rewards pool contract for a specific xApp
 *
 * @param thor  the connex instance
 * @param xAppId  the xApp id
 * @returns the allowance in the x2Earn rewards pool contract for a specific xApp
 */
export const useAppAllowance = (appId: string, formattedVersion?: boolean) => {
  return useCall({
    contractInterface: X2EarnRewardsPoolInterface,
    contractAddress: X2EARN_REWARDS_POOL_CONTRACT,
    method: "allowance",
    args: [appId],
    formattedVersion: formattedVersion,
  })
}
