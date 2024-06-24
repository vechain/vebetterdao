import { TransactionModal } from "@/components"
import { useUpdateAppDetails, useUploadAppMetadata } from "@/hooks"
import { useDisclosure } from "@chakra-ui/react"

type Props = {
  transactionModal: ReturnType<typeof useDisclosure>
  handleClose: () => void
  uploadMetadataMutation: ReturnType<typeof useUploadAppMetadata>
  updateAppDetailsMutation: ReturnType<typeof useUpdateAppDetails>
  onTryAgain: () => void
}

export const UpdateAppMetadataTransactionModal = ({
  transactionModal,
  handleClose,
  uploadMetadataMutation,
  updateAppDetailsMutation,
  onTryAgain,
}: Props) => {
  return (
    <TransactionModal
      isOpen={transactionModal.isOpen}
      onClose={handleClose}
      confirmationTitle="Update App details"
      successTitle="App details updated!"
      status={
        uploadMetadataMutation.metadataUploading
          ? "uploadingMetadata"
          : updateAppDetailsMutation.error || uploadMetadataMutation.metadataUploadError
            ? "error"
            : updateAppDetailsMutation.status
      }
      errorDescription={uploadMetadataMutation.metadataUploadError?.message ?? updateAppDetailsMutation.error?.reason}
      errorTitle={
        uploadMetadataMutation.metadataUploadError
          ? "Error uploading metadata"
          : updateAppDetailsMutation.error
            ? "Error updating app details"
            : undefined
      }
      showTryAgainButton={true}
      onTryAgain={onTryAgain}
      pendingTitle="Updating app details..."
      txId={updateAppDetailsMutation.txReceipt?.meta.txID}
      showExplorerButton
    />
  )
}
