import { useCallback, useState } from "react"
import { XAppMetadata } from "@/api"
import { base64UrlToFile } from "@/utils/BlobUtils"
import { NFTStorageUtils } from "@repo/utils"
import { toIPFSURL } from "@/utils"

export const useUploadAppMetadata = () => {
  const [metadataUploading, setMetadataUploading] = useState(false)
  const [metadataUploadError, setMetadataUploadError] = useState<Error>()

  const onMetadataUpload = useCallback(async (metadata: XAppMetadata) => {
    try {
      setMetadataUploading(true)
      let logo = metadata.logo
      let banner = metadata.banner

      const ipfsLogoUri = await NFTStorageUtils.nftStorageClient.storeBlob(
        await base64UrlToFile(logo, "logo.jpeg", "image/jpeg"),
      )
      const ipfsBannerUri = await NFTStorageUtils.nftStorageClient.storeBlob(
        await base64UrlToFile(banner, "banner.jpeg", "image/jpeg"),
      )

      const data = new Blob(
        [
          JSON.stringify({
            ...metadata,
            logo: toIPFSURL(ipfsLogoUri),
            banner: toIPFSURL(ipfsBannerUri),
          }),
        ],
        {
          type: "application/json",
        },
      )
      const metadataUri = await NFTStorageUtils.nftStorageClient.storeBlob(data)
      setMetadataUploading(false)
      return metadataUri
    } catch (error) {
      console.error("Error uploading metadata", error)
      setMetadataUploadError(error as Error)
      return undefined
    } finally {
      setMetadataUploading(false)
    }
  }, [])

  return { onMetadataUpload, metadataUploading, metadataUploadError }
}
