import { TransactionModal } from "@/components"
import { useUpdateAppDetails, useUploadAppMetadata } from "@/hooks"
import { useDisclosure } from "@chakra-ui/react"
import { useTransactionError } from "@/hooks/useTransactionError"
import { useTransactionStatus } from "@/hooks/useTransactionStatus"

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
  const modalStatus = useTransactionStatus([
    { status: uploadMetadataMutation.metadataUploading ? "uploadingMetadata" : undefined },
    { status: updateAppDetailsMutation.error || uploadMetadataMutation.metadataUploadError ? "error" : undefined },
    { status: updateAppDetailsMutation.status },
  ])

  const errorTitle = useTransactionError([
    { error: uploadMetadataMutation.metadataUploadError, title: "Error uploading metadata" },
    { error: updateAppDetailsMutation.error, title: "Error updating app details" },
  ])

  return (
    <TransactionModal
      isOpen={transactionModal.isOpen}
      onClose={handleClose}
      confirmationTitle="Update App details"
      successTitle="App details updated!"
      status={modalStatus}
      errorDescription={uploadMetadataMutation.metadataUploadError?.message ?? updateAppDetailsMutation.error?.reason}
      errorTitle={errorTitle}
      showTryAgainButton={true}
      onTryAgain={onTryAgain}
      pendingTitle="Updating app details..."
      txId={updateAppDetailsMutation.txReceipt?.meta.txID}
      showExplorerButton
    />
  )
}
