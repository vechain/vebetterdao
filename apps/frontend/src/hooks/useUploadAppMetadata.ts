import { useCallback, useState } from "react"
import { XAppMetadata } from "@/api"
import { base64ToBlob } from "@/utils/BlobUtils"
import JSZip from "jszip"
import { uploadBlobToIPFS } from "@/utils"

/**
 * Uploads app metadata to IPFS
 * @returns metadataUploading, metadataUploadError, onMetadataUpload
 */
export const useUploadAppMetadata = () => {
  const [metadataUploading, setMetadataUploading] = useState(false)
  const [metadataUploadError, setMetadataUploadError] = useState<Error>()

  const onMetadataUpload = useCallback(async (metadata: XAppMetadata, transformImages = true) => {
    try {
      setMetadataUploading(true)

      if (transformImages) {
        const zip = new JSZip()

        // Create a 'media' folder inside the zip
        const mediaFolder = zip.folder("media") as JSZip

        // Convert base64 images to Blob and add to 'media' folder in the zip if they are defined
        if (metadata.logo) {
          const logoBlob = base64ToBlob(metadata.logo.split(",")[1] ?? "", "image/jpeg")
          mediaFolder.file("logo.jpeg", logoBlob)
        }

        if (metadata.banner) {
          const bannerBlob = base64ToBlob(metadata.banner.split(",")[1] ?? "", "image/jpeg")
          mediaFolder.file("banner.jpeg", bannerBlob)
        }

        for (let i = 0; i < metadata.screenshots.length; i++) {
          const screenshot = metadata.screenshots[i]
          if (screenshot) {
            const screenshotData = screenshot.split(",")[1] ?? ""
            const screenshotBlob = base64ToBlob(screenshotData, "image/jpeg")
            mediaFolder.file(`screenshot${i + 1}.jpeg`, screenshotBlob)
          }
        }

        // Generate zip Blob
        const zipBlob = await zip.generateAsync({ type: "blob" })

        // Upload zip to IPFS
        const imagesCid = await uploadBlobToIPFS(zipBlob, "media.zip")

        // Prepare metadata object with updated URLs pointing inside the 'media' folder
        const updatedMetadata = {
          ...metadata,
          logo: metadata.logo ? `ipfs://${imagesCid}/media/logo.jpeg` : metadata.logo,
          banner: metadata.banner ? `ipfs://${imagesCid}/media/banner.jpeg` : metadata.banner,
          screenshots: metadata.screenshots.map((_, index) => `ipfs://${imagesCid}/media/screenshot${index + 1}.jpeg`),
        }

        // Generate metadata Blob
        const metadataBlob = new Blob([JSON.stringify(updatedMetadata)], { type: "application/json" })
        const metadataUri = await uploadBlobToIPFS(metadataBlob, "metadata.json")
        return metadataUri
      } else {
        const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" })
        const metadataUri = await uploadBlobToIPFS(metadataBlob, "metadata.json")
        return metadataUri
      }
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
