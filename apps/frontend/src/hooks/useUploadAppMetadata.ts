"use client"
import { useCallback, useState } from "react"
import { XAppMetadata } from "@/api"
import { base64ToBlob } from "@/utils/BlobUtils"
import JSZip from "jszip"
import { uploadBlobToIPFS } from "@/utils"
import { IMAGE_REQUIREMENTS } from "@/constants/XAppsMedia"
export type UseUploadAppMetadataReturnValue = {
  metadataUploading: boolean
  metadataUploadError: Error | undefined
  onMetadataUpload: (metadata: XAppMetadata, transformImages?: boolean) => Promise<string | undefined>
}
/**
 * Uploads app metadata to IPFS
 * @returns metadataUploading, metadataUploadError, onMetadataUpload
 */
export const useUploadAppMetadata = (): UseUploadAppMetadataReturnValue => {
  const [metadataUploading, setMetadataUploading] = useState(false)
  const [metadataUploadError, setMetadataUploadError] = useState<Error>()

  const processImage = (base64Data: string, imageType: keyof typeof IMAGE_REQUIREMENTS, fileName: string) => {
    const config = IMAGE_REQUIREMENTS[imageType]
    const blob = base64ToBlob(base64Data.split(",")[1] ?? "", config.mimeType)
    return {
      blob,
      path: `${fileName}.${config.extension}`,
    }
  }

  const onMetadataUpload = useCallback(async (metadata: XAppMetadata, transformImages = true) => {
    try {
      setMetadataUploading(true)

      if (transformImages) {
        const zip = new JSZip()

        // Create a 'media' folder inside the zip
        const mediaFolder = zip.folder("media") as JSZip

        // Convert base64 images to Blob and add to 'media' folder in the zip if they are defined
        if (metadata.logo) {
          const { blob, path } = processImage(metadata.logo, "logo", "logo")
          mediaFolder.file(path, blob)
        }

        if (metadata.banner) {
          const { blob, path } = processImage(metadata.banner, "banner", "banner")
          mediaFolder.file(path, blob)
        }

        if (metadata.ve_world.banner) {
          const { blob, path } = processImage(metadata.ve_world.banner, "ve_world_banner", "ve_world_banner")
          mediaFolder.file(path, blob)
        }

        for (let i = 0; i < metadata.screenshots.length; i++) {
          const screenshot = metadata.screenshots[i]
          if (screenshot) {
            const { blob, path } = processImage(screenshot, "screenshot", `screenshot${i + 1}`)
            mediaFolder.file(path, blob)
          }
        }

        // Generate zip Blob
        const zipBlob = await zip.generateAsync({ type: "blob" })

        // Upload zip to IPFS
        const imagesCid = await uploadBlobToIPFS(zipBlob, "media.zip")

        // Prepare metadata object with updated URLs pointing inside the 'media' folder
        const updatedMetadata = {
          ...metadata,
          logo: metadata.logo ? `ipfs://${imagesCid}/media/logo.${IMAGE_REQUIREMENTS.logo.extension}` : metadata.logo,
          banner: metadata.banner
            ? `ipfs://${imagesCid}/media/banner.${IMAGE_REQUIREMENTS.banner.extension}`
            : metadata.banner,
          screenshots: metadata.screenshots.map(
            (_, index) => `ipfs://${imagesCid}/media/screenshot${index + 1}.${IMAGE_REQUIREMENTS.screenshot.extension}`,
          ),
          ve_world: {
            banner: metadata.ve_world.banner
              ? `ipfs://${imagesCid}/media/ve_world_banner.${IMAGE_REQUIREMENTS.ve_world_banner.extension}`
              : metadata.ve_world.banner,
          },
        }

        // Generate metadata Blob
        const metadataBlob = new Blob([JSON.stringify(updatedMetadata)], { type: "application/json" })
        return await uploadBlobToIPFS(metadataBlob, "metadata.json")
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
