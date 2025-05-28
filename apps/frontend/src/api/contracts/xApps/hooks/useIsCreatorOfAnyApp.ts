import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts/typechain-types"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const address = getConfig().x2EarnAppsContractAddress
const abi = X2EarnApps__factory.abi
const method = "isCreatorOfAnyApp" as const

/**
 * Returns the query key boolean if the creator have already submitted an app
 * @returns The query key for fetching the creator NFT.
 */
export const getIsCreatorOfAnyAppQueryKey = (walletAddress: string) => {
  return getCallClauseQueryKey<typeof abi>({ address, method, args: [walletAddress] })
}

/**
 * Hook to get if the user has already submitted an app
 *
 * @param walletAddress The wallet address to check for the creator NFT.
 * @returns True if the wallet address has already submitted an app, false otherwise.
 */
export const useIsCreatorOfAnyApp = (walletAddress: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [walletAddress],
    queryOptions: {
      enabled: !!walletAddress,
      select: data => data[0],
    },
  })
}
