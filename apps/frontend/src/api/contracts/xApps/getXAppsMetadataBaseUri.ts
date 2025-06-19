import { useCallClause, getCallClauseQueryKey, executeCallClause, ThorClient } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"

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

/**
 *  Returns the baseUri of the xApps metadata
 * @param thor  the thor client
 * @returns  the baseUri of the xApps metadata
 */
export const getXAppsMetadataBaseUri = async (thor: ThorClient): Promise<string> => {
  const [uri] = await executeCallClause({
    thor,
    contractAddress: address,
    abi,
    args: [],
    method: "baseURI",
  })

  return uri
}
