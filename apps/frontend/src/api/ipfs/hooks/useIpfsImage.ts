import { convertUriToUrl, resolveMediaTypeFromMimeType } from "@/utils"
import { useQueries, useQuery } from "@tanstack/react-query"
import { NFTMediaType } from "@/types"

export interface IpfsImage {
  image: string
  mime: string
  mediaType: NFTMediaType
}
export const MAX_IMAGE_SIZE = 1024 * 1024 * 10 // 10MB

/**
 * Fetches NFT media from IPFS
 * @param uri - The IPFS URI of the NFT media
 * @returns The NFT media
 */
export const getIpfsImage = async (uri?: string): Promise<IpfsImage> => {
  if (!uri) throw new Error("IPFS URI is required")

  const response = await fetch(convertUriToUrl(uri))

  if (!response.ok) {
    throw new Error(`Failed to fetch IPFS image: ${response.status}`)
  }

  const blob = await response.blob()

  if (blob.size > MAX_IMAGE_SIZE) {
    throw new Error("IPFS image exceeds max supported size")
  }

  // Check if the MIME type is allowed
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/tiff",
    "image/webp",
    "image/svg+xml",
    "application/json",
  ]
  const mimeType = blob.type || response.headers.get("content-type") || ""

  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error(`Unsupported MIME type: ${mimeType}`)
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(blob)
    reader.onloadend = () => {
      resolve({
        image: reader.result as string,
        mime: mimeType,
        mediaType: resolveMediaTypeFromMimeType(mimeType),
      })
    }
    reader.onerror = () => {
      reject(Error("Error occurred while reading blob."))
    }
  })
}

/**
 * @param imageIpfsUri - The IPFS URI of the NFT media
 * @returns The NFT media
 */
export const getIpfsImageQueryKey = (imageIpfsUri?: null | string) => ["ipfsImage", imageIpfsUri]

/**
 * Hook to fetch NFT media from IPFS
 * @param imageIpfsUri - The IPFS URI of the NFT media
 * @returns The NFT media
 */
export const useIpfsImage = (imageIpfsUri?: null | string) => {
  return useQuery({
    queryKey: getIpfsImageQueryKey(imageIpfsUri),
    queryFn: () => getIpfsImage(imageIpfsUri!),
    enabled: !!imageIpfsUri,
    staleTime: Infinity,
  })
}

/**
 * Custom hook to fetch a list of IPFS images.
 *
 * @param imageIpfsUriList - An array of IPFS URIs for the images.
 * @returns An array of queries for each IPFS image URI.
 */
export const useIpfsImageList = (imageIpfsUriList: string[]) => {
  // Ensure unique URIs to avoid duplicate query keys
  const uniqueUris = Array.from(new Set(imageIpfsUriList.filter(Boolean)))

  // Run useQueries once per unique URI
  const uniqueResults = useQueries({
    queries: uniqueUris.map(uri => ({
      queryKey: ["ipfs-image-list", getIpfsImageQueryKey(uri)],
      queryFn: () => getIpfsImage(uri),
      enabled: !!uri,
      staleTime: Infinity,
    })),
  })

  // Map from URI to the query result
  const uriMap = new Map()
  uniqueUris.forEach((uri, i) => uriMap.set(uri, uniqueResults[i]))

  // Return results aligned to the original input order
  return imageIpfsUriList.map(uri => uriMap.get(uri))
}
