import { TransactionModal, TransactionModalStatus } from "@/components"
import { useDisclosure } from "@chakra-ui/react"
import {
  useUpdateAppDetails,
  useUploadAppMetadata,
  useTransactionModalErrorTitle,
  useTransactionModalStatus,
} from "@/hooks"

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
  const modalStatus = useTransactionModalStatus([
    { status: uploadMetadataMutation.metadataUploading ? TransactionModalStatus.UploadingMetadata : undefined },
    {
      status:
        updateAppDetailsMutation.error || uploadMetadataMutation.metadataUploadError
          ? TransactionModalStatus.Error
          : undefined,
    },
    { status: updateAppDetailsMutation.status as TransactionModalStatus },
  ])

  const errorTitle = useTransactionModalErrorTitle([
    { error: uploadMetadataMutation.metadataUploadError, title: "Error uploading metadata" },
    { error: updateAppDetailsMutation.error, title: "Error updating app details" },
  ])

  return (
    <TransactionModal
      isOpen={transactionModal.isOpen}
      onClose={handleClose}
      status={modalStatus as TransactionModalStatus}
      errorDescription={uploadMetadataMutation.metadataUploadError?.message ?? updateAppDetailsMutation.error?.reason}
      onTryAgain={onTryAgain}
      txId={updateAppDetailsMutation.txReceipt?.meta.txID}
      showExplorerButton
      titles={{
        [TransactionModalStatus.Success]: "App details updated!",
        [TransactionModalStatus.Error]: errorTitle,
        [TransactionModalStatus.Pending]: "Updating app details...",
        [TransactionModalStatus.UploadingMetadata]: "Uploading metadata...",
      }}
    />
  )
}
