import { useCallback, useState } from "react"
import { XAppMetadata } from "@/api"
import { base64UrlToFile } from "@/utils/BlobUtils"
import { NFTStorageUtils } from "@repo/utils"
import { toIPFSURL } from "@/utils"

/**
 *  Uploads app metadata to IPFS
 * @returns metadataUploading, metadataUploadError, onMetadataUpload
 */
export const useUploadAppMetadata = () => {
  const [metadataUploading, setMetadataUploading] = useState(false)
  const [metadataUploadError, setMetadataUploadError] = useState<Error>()

  const onMetadataUpload = useCallback(async (metadata: XAppMetadata, transformImages = true) => {
    try {
      setMetadataUploading(true)
      let data: Blob
      if (transformImages) {
        let logo = metadata.logo
        let banner = metadata.banner

        // TODO: remove .jpeg extension?
        const [ipfsLogoUri, ipfsBannerUri, ...scrennshotUrls] = await Promise.all([
          NFTStorageUtils.nftStorageClient.storeBlob(await base64UrlToFile(logo, "logo.jpeg", "image/jpeg")),
          NFTStorageUtils.nftStorageClient.storeBlob(await base64UrlToFile(banner, "banner.jpeg", "image/jpeg")),
          ...metadata.screenshots.map(async screenshot =>
            NFTStorageUtils.nftStorageClient.storeBlob(
              await base64UrlToFile(screenshot, "screenshot.jpeg", "image/jpeg"),
            ),
          ),
        ])

        data = new Blob(
          [
            JSON.stringify({
              ...metadata,
              logo: toIPFSURL(ipfsLogoUri),
              banner: toIPFSURL(ipfsBannerUri),
              screenshots: scrennshotUrls.map((uri: string) => toIPFSURL(uri)),
            }),
          ],
          {
            type: "application/json",
          },
        )
      } else {
        data = new Blob([JSON.stringify(metadata)], {
          type: "application/json",
        })
      }

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
