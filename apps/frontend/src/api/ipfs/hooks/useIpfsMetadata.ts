import { useQuery } from "@tanstack/react-query"

import { convertUriToUrl } from "@/utils/uri"

/**
 * Fetches metadata from IPFS for a given URI
 * @param uri - The IPFS URI
 * @param parseJson - Whether to parse the JSON
 * @returns The metadata
 */
export const getIpfsMetadata = async <T>(uri?: string): Promise<T> => {
  if (!uri) throw new Error("No URI provided")
  const newUri = convertUriToUrl(uri)
  const response = await fetch(newUri)
  if (!response.ok) {
    throw new Error(`Failed to fetch IPFS metadata: ${response.status}`)
  }
  const data = await response.json()
  return data as unknown as T
}
export const getIpfsMetadataQueryKey = (ipfsUri?: string) => ["IPFS_METADATA", ipfsUri]
/**
 * Fetches metadata from IPFS for a given URI
 * @param ipfsUri - The IPFS URI
 * @returns The metadata from IPFS
 */
export const useIpfsMetadata = <T>(ipfsUri?: string) => {
  return useQuery({
    queryKey: getIpfsMetadataQueryKey(ipfsUri),
    queryFn: () => getIpfsMetadata<T>(ipfsUri),
    enabled: !!ipfsUri,
    staleTime: Infinity,
  })
}
