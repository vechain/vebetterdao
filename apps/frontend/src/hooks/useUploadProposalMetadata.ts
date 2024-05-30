import { useCallback, useState } from "react"
import { NFTStorageUtils } from "@repo/utils"
import { ProposalMetadata } from "@/api"

/**
 *  Uploads proposal metadata to IPFS
 * @returns metadataUploading, metadataUploadError, onMetadataUpload
 */
export const useUploadProposalMetadata = () => {
  const [metadataUploading, setMetadataUploading] = useState(false)
  const [metadataUploadError, setMetadataUploadError] = useState<Error>()

  const onMetadataUpload = useCallback(async (data: ProposalMetadata) => {
    try {
      setMetadataUploading(true)

      const blobData = new Blob([JSON.stringify(data)], {
        type: "application/json",
      })
      const metadataUri = await NFTStorageUtils.nftStorageClient.storeBlob(blobData)
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
