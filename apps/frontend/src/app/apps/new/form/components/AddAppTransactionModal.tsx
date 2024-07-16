import { TransactionModal } from "@/components"
import { useAddApp, useUploadAppMetadata } from "@/hooks"
import { useDisclosure } from "@chakra-ui/react"

type Props = {
  transactionModal: ReturnType<typeof useDisclosure>
  handleClose: () => void
  uploadMetadataMutation: ReturnType<typeof useUploadAppMetadata>
  addAppMutation: ReturnType<typeof useAddApp>
  onTryAgain: () => void
}

export const AddAppTransactionModal = ({
  transactionModal,
  handleClose,
  uploadMetadataMutation,
  addAppMutation,
  onTryAgain,
}: Props) => {
  return (
    <TransactionModal
      isOpen={transactionModal.isOpen}
      onClose={handleClose}
      confirmationTitle="Add App"
      successTitle="App added successfully!"
      status={
        uploadMetadataMutation.metadataUploading
          ? "uploadingMetadata"
          : addAppMutation.error || uploadMetadataMutation.metadataUploadError
            ? "error"
            : addAppMutation.status
      }
      errorDescription={uploadMetadataMutation.metadataUploadError?.message ?? addAppMutation.error?.reason}
      errorTitle={
        uploadMetadataMutation.metadataUploadError
          ? "Error uploading metadata"
          : addAppMutation.error
            ? "Error adding app"
            : undefined
      }
      showTryAgainButton={true}
      onTryAgain={onTryAgain}
      pendingTitle="Adding app..."
      txId={addAppMutation.txReceipt?.meta.txID}
      showExplorerButton
    />
  )
}
