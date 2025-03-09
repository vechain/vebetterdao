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
  if (!uri) throw new Error("No URI provided")

  const newUri = convertUriToUrl(uri)

  const response = await fetch(newUri)

  if (!response.ok) {
    throw new Error(`Failed to fetch image from IPFS: ${response.status} ${response.statusText}`)
  }

  const blob = await response.blob()

  // Check if the image size is within the limit
  if (blob.size > MAX_IMAGE_SIZE) {
    throw new Error(`IPFS image size exceeds limit of ${MAX_IMAGE_SIZE}, blob size is ${blob.size} bytes`)
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
  ]
  if (!allowedMimeTypes.includes(blob.type)) {
    throw new Error(`IPFS image unsupported MIME type: ${blob.type}`)
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(blob)

    reader.onloadend = () => {
      resolve({
        image: reader.result as string,
        mime: blob.type,
        mediaType: resolveMediaTypeFromMimeType(blob.type),
      })
    }

    reader.onerror = () => {
      reject(Error("Error occurred while reading IPFS image blob!"))
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
  return useQueries({
    queries: imageIpfsUriList.map(imageIpfsUri => ({
      queryKey: getIpfsImageQueryKey(imageIpfsUri),
      queryFn: () => getIpfsImage(imageIpfsUri),
      enabled: !!imageIpfsUri,
      staleTime: Infinity,
    })),
  })
}
