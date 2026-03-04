"use client"
import JSZip from "jszip"
import { useCallback, useState } from "react"

import { IMAGE_REQUIREMENTS } from "@/constants/XAppsMedia"
import { base64ToBlob } from "@/utils/BlobUtils"
import { uploadBlobToIPFS } from "@/utils/ipfs"

import { XAppMetadata } from "../../api/contracts/xApps/getXAppMetadata"

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

        if (metadata.ve_world.featured_image) {
          const { blob, path } = processImage(
            metadata.ve_world.featured_image,
            "ve_world_featured_image",
            "ve_world_featured_image",
          )
          mediaFolder.file(path, blob)
        }

        const validScreenshots = metadata.screenshots.filter(Boolean)

        // #region agent log
        fetch('http://127.0.0.1:7406/ingest/48d2fcf8-766a-47f1-bc2b-cd0c79ca61f3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fe4e0c'},body:JSON.stringify({sessionId:'fe4e0c',location:'useUploadAppMetadata.ts:screenshots-input',message:'Screenshots input to upload',data:{rawCount:metadata.screenshots.length,validCount:validScreenshots.length,filtered:metadata.screenshots.length-validScreenshots.length,values:validScreenshots.map((s,i)=>({index:i,length:s?.length??0,prefix:s?.substring(0,80),isDataUrl:s?.startsWith('data:')??false}))},timestamp:Date.now(),runId:'post-fix'})}).catch(()=>{});
        // #endregion

        for (let i = 0; i < validScreenshots.length; i++) {
          const { blob, path } = processImage(validScreenshots[i]!, "screenshot", `screenshot${i + 1}`)
          // #region agent log
          fetch('http://127.0.0.1:7406/ingest/48d2fcf8-766a-47f1-bc2b-cd0c79ca61f3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fe4e0c'},body:JSON.stringify({sessionId:'fe4e0c',location:'useUploadAppMetadata.ts:screenshot-blob',message:'Screenshot blob created',data:{index:i,blobSize:blob.size,blobType:blob.type,path},timestamp:Date.now(),runId:'post-fix'})}).catch(()=>{});
          // #endregion
          mediaFolder.file(path, blob)
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
          screenshots: validScreenshots.map(
            (_, index) => `ipfs://${imagesCid}/media/screenshot${index + 1}.${IMAGE_REQUIREMENTS.screenshot.extension}`,
          ),
          ve_world: {
            banner: metadata.ve_world.banner
              ? `ipfs://${imagesCid}/media/ve_world_banner.${IMAGE_REQUIREMENTS.ve_world_banner.extension}`
              : metadata.ve_world.banner,
            featured_image: metadata.ve_world.featured_image
              ? `ipfs://${imagesCid}/media/ve_world_featured_image.${IMAGE_REQUIREMENTS.ve_world_featured_image.extension}`
              : metadata.ve_world.featured_image,
          },
        }

        // #region agent log
        fetch('http://127.0.0.1:7406/ingest/48d2fcf8-766a-47f1-bc2b-cd0c79ca61f3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fe4e0c'},body:JSON.stringify({sessionId:'fe4e0c',location:'useUploadAppMetadata.ts:metadata-output',message:'Final metadata screenshots',data:{screenshotUris:updatedMetadata.screenshots,imagesCid,validCount:validScreenshots.length},timestamp:Date.now(),runId:'post-fix'})}).catch(()=>{});
        // #endregion

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
