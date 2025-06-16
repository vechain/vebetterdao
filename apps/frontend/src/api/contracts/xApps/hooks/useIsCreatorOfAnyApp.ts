import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts/typechain-types"

const x2EarnAppsContractAddress = getConfig().x2EarnAppsContractAddress
const x2EarnAppsInterface = X2EarnApps__factory.createInterface()
const method = "isCreatorOfAnyApp"

/**
 * Returns the query key boolean if the creator have already submitted an app
 * @returns The query key for fetching the creator NFT.
 */
export const getIsCreatorOfAnyAppQueryKey = (walletAddress: string) => {
  return getCallKey({ method, keyArgs: [walletAddress] })
}

/**
 * Hook to get if the user has already submitted an app
 *
 * @param walletAddress The wallet address to check for the creator NFT.
 * @returns True if the wallet address has already submitted an app, false otherwise.
 */
export const useIsCreatorOfAnyApp = (walletAddress: string) => {
  return useCall({
    contractInterface: x2EarnAppsInterface,
    contractAddress: x2EarnAppsContractAddress,
    method,
    args: [walletAddress],
    enabled: !!walletAddress,
  })
}
