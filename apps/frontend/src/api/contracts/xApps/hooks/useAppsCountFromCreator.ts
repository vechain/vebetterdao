import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts/typechain-types"

const x2EarnAppsContractAddress = getConfig().x2EarnAppsContractAddress
const x2EarnAppsInterface = X2EarnApps__factory.createInterface()
const method = "creatorApps"

/**
 * Returns the number of apps created by the creator
 * @dev note that this should be 1 from x2EarnApps v5, but app submitted before v5 could have more than 1 creator
 * @returns The query key for fetching the number of apps created by the creator
 */
export const getAppsCountFromCreatorQueryKey = (walletAddress: string) => {
  return getCallKey({ method, keyArgs: [walletAddress] })
}

/**
 * Hook to get the number of apps created by the creator
 * @param walletAddress The wallet address to check for the creator NFT.
 * @returns The number of apps created by the creator
 */
export const useAppsCountFromCreator = (walletAddress: string) => {
  return useCall({
    contractInterface: x2EarnAppsInterface,
    contractAddress: x2EarnAppsContractAddress,
    method,
    args: [walletAddress],
    enabled: !!walletAddress,
  })
}
