import { useQueries } from "@tanstack/react-query"
import { getIpfsMetadata, getIpfsMetadataQueryKey } from "./useIpfsMetadata"

/**
 * Fetches metadatas from IPFS for given URIs
 * @param ipfsUris - The IPFS URIs
 * @returns The metadata from IPFS for each URI
 */
export const useIpfsMetadatas = <T>(ipfsUris: string[], parseJson = false) => {
  return useQueries({
    queries: ipfsUris.map(uri => ({
      queryKey: getIpfsMetadataQueryKey(uri),
      queryFn: async () => {
        return getIpfsMetadata<T>(uri, parseJson)
      },
      enabled: !!uri,
    })),
  })
}
