"use client"
import { useCallback, useState } from "react"
import { uploadBlobToIPFS } from "@/utils"
import { GrantFormData } from "./proposals/grants/types"

type GrantProposalMetadata = Omit<GrantFormData, "termsOfService"> & {
  title: string
  shortDescription: string
}

type GrantProposalMilestones = GrantFormData["milestones"]

type GrantProposalMetadataOptions = GrantProposalMetadata | GrantProposalMilestones

/**
 * Uploads proposal metadata to IPFS.
 * @returns { metadataUploading, metadataUploadError, onMetadataUpload }
 */
export const useUploadGrantProposalMetadata = () => {
  const [metadataUploading, setMetadataUploading] = useState(false)
  const [metadataUploadError, setMetadataUploadError] = useState<Error>()

  const onMetadataUpload = useCallback(async (data: GrantProposalMetadataOptions) => {
    try {
      setMetadataUploading(true)

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
