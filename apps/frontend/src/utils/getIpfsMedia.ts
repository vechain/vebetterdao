import axios from "axios"
import { convertUriToUrl } from "./uri"
import { NFTMediaType } from "@/types"
import { resolveMediaTypeFromMimeType } from "./media"

export interface NFTMedia {
  image: string
  mime: string
  mediaType: NFTMediaType
}
export const MAX_IMAGE_SIZE = 1024 * 1024 * 10 // 10MB

export const getIpfsMedia = async (uri: string): Promise<NFTMedia> => {
  const response = await axios.get(convertUriToUrl(uri), {
    responseType: "blob",
    maxContentLength: MAX_IMAGE_SIZE,
  })

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
  if (!allowedMimeTypes.includes(response.data.type)) {
    throw new Error(`Unsupported MIME type: ${response.data.type}`)
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(response.data)
    reader.onloadend = () => {
      resolve({
        image: reader.result as string,
        mime: response.data.type,
        mediaType: resolveMediaTypeFromMimeType(response.data.type),
      })
    }
    reader.onerror = () => {
      reject(Error("Error occurred while reading blob."))
    }
  })
}
