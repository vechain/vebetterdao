import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/x-2-earn-apps/X2EarnApps__factory"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const address = getConfig().x2EarnAppsContractAddress
const abi = X2EarnApps__factory.abi
const method = "baseURI" as const
/**
 * Returns the query key for fetching the xApps metadata base URI.
 * @returns The query key for fetching the xApps metadata base URI.
 */
export const getXAppsMetadataBaseUriQueryKey = () => getCallClauseQueryKey({ abi, address, method })
/**
 * Hook to get the baseUri of the xApps metadata
 * @returns the baseUri of the xApps metadata
 */
export const useXAppsMetadataBaseUri = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data => data[0],
      staleTime: 1000 * 60 * 60, // 1 hour
    },
  })
}
