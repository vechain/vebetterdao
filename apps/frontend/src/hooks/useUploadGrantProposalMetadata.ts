"use client"
import { useCallback, useState } from "react"
import { uploadBlobToIPFS } from "@/utils"
import { GrantFormData } from "./proposals/grants/types"

type UploadData = (GrantFormData & { title?: string; shortDescription?: string }) | GrantFormData["milestones"]

/**
 * Uploads proposal metadata to IPFS.
 * @returns { metadataUploading, metadataUploadError, onMetadataUpload }
 */
export const useUploadGrantProposalMetadata = () => {
  const [metadataUploading, setMetadataUploading] = useState(false)
  const [metadataUploadError, setMetadataUploadError] = useState<Error | null>(null)

  const onMetadataUpload = useCallback(async (data: UploadData): Promise<string | undefined> => {
    try {
      setMetadataUploading(true)
      setMetadataUploadError(null)
      // Create a Blob from the proposal metadata
      const metadataBlob = new Blob([JSON.stringify(data)], { type: "application/json" })

      // Upload the metadata Blob to IPFS
      const metadataUri = await uploadBlobToIPFS(metadataBlob, "metadata.json")

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
