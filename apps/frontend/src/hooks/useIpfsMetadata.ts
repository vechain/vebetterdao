import axios from "axios"
import { useQuery } from "@tanstack/react-query"
import { convertUriToUrl } from "@/utils/uri"

export type NFTMetadata = {
  name: string
  description: string
  image: string
  attributes: {
    trait_type: string
    value: string
  }[]
}

/**
 * Fetches NFT metadata from IPFS
 * @param uri - The IPFS URI of the NFT metadata
 * @returns The NFT metadata
 */
export const getIpfsMetadata = async (uri: string): Promise<NFTMetadata> => {
  const metadata = await axios.get<NFTMetadata>(convertUriToUrl(uri), {
    timeout: 20000,
  })

  return metadata.data
}

export const getIpfsMetadataQueryKey = (ipfsUri: null | string) => ["ipfsMetadata", ipfsUri]

/**
 * Fetches NFT metadata from IPFS
 * @param ipfsUri - The IPFS URI of the NFT metadata
 * @returns The NFT metadata
 */
export const useIpfsMetadata = (ipfsUri: null | string) => {
  return useQuery({
    queryKey: getIpfsMetadataQueryKey(ipfsUri),
    queryFn: () => getIpfsMetadata(ipfsUri!),
    enabled: !!ipfsUri,
  })
}
