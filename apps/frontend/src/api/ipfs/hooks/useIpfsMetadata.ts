import axios from "axios"
import { useQuery } from "@tanstack/react-query"
import { convertUriToUrl } from "@/utils/uri"

/**
 * Fetches metadata from IPFS for a given URI
 * @param uri - The IPFS URI
 * @param parseJson - Whether to parse the JSON
 * @returns The metadata
 */
export const getIpfsMetadata = async <T>(uri?: string, parseJson = false): Promise<T> => {
  if (!uri) throw new Error("No URI provided")
  const newUri = convertUriToUrl(uri)
  console.log("newUrio", newUri)
  const metadata = await axios.get<string>(newUri)

  if (parseJson) return JSON.parse(metadata.data)

  return metadata.data as unknown as T
}

export const getIpfsMetadataQueryKey = (ipfsUri?: string) => ["IPFS_METADATA", ipfsUri]

/**
 * Fetches metadata from IPFS for a given URI
 * @param ipfsUri - The IPFS URI
 * @returns The metadata from IPFS
 */
export const useIpfsMetadata = <T>(ipfsUri?: string, parseJson = false) => {
  return useQuery({
    queryKey: getIpfsMetadataQueryKey(ipfsUri),
    queryFn: () => getIpfsMetadata<T>(ipfsUri, parseJson),
    enabled: !!ipfsUri,
    staleTime: Infinity,
  })
}
