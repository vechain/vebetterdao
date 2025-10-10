import { useQueries } from "@tanstack/react-query"

import { getIpfsMetadata, getIpfsMetadataQueryKey } from "./useIpfsMetadata"

/**
 * Fetches metadatas from IPFS for given URIs
 * @param ipfsUris - The IPFS URIs
 * @returns The metadata from IPFS for each URI
 */
export const useIpfsMetadatas = <T>(ipfsUris: string[], parseJson = false) => {
  // Unique URIs to avoid duplicate queries
  const uniqueUris = Array.from(new Set(ipfsUris.filter(Boolean)))
  // Use queries only once per unique URI
  const uniqueResults = useQueries({
    queries: uniqueUris.map(uri => ({
      queryKey: ["ipfs-metadata", getIpfsMetadataQueryKey(uri)],
      queryFn: () => getIpfsMetadata<T>(uri, parseJson),
      enabled: !!uri,
    })),
  })
  // Map URI to result
  const uriMap = new Map()
  uniqueUris.forEach((uri, i) => uriMap.set(uri, uniqueResults[i]))
  // Restore original order
  const orderedResults = ipfsUris.map(uri => uriMap.get(uri))
  return orderedResults
}
