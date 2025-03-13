import { ReactNode, useCallback, useMemo } from "react"
import { ConfirmationModalContent } from "./ConfirmationModalContent"
import { ErrorModalContent } from "./ErrorModalContent"
import { LoadingModalContent } from "./LoadingModalContent"
import { SuccessModalContent } from "./SuccessModalContent"
import { Modal, ModalOverlay } from "@chakra-ui/react"
import { CustomModalContent } from "@/components/CustomModalContent"
import { UploadingMetadataModalContent } from ".//UploadingMetadataModalContent"

export enum TransactionModalStatus {
  Ready = "ready",
  Pending = "pending",
  WaitingConfirmation = "waitingConfirmation",
  Error = "error",
  Success = "success",
  UploadingMetadata = "uploadingMetadata",
  Unknown = "unknown",
}

export type TransactionModalProps = {
  isOpen: boolean
  onClose: () => void
  status: TransactionModalStatus
  pendingTitle?: ReactNode
  confirmationTitle?: ReactNode
  errorTitle?: ReactNode
  errorDescription?: string
  successTitle?: ReactNode
  showSocialButtons?: boolean
  socialDescriptionEncoded?: string
  showTryAgainButton?: boolean
  onTryAgain?: () => void
  showExplorerButton?: boolean
  txId?: string
  customContent?: Partial<Record<TransactionModalStatus, ReactNode>>
  isSuccessBeenTrack?: boolean
}

export const TransactionModal = ({
  isOpen,
  onClose,
  status,
  pendingTitle,
  confirmationTitle,
  errorTitle,
  errorDescription,
  successTitle,
  showSocialButtons = false,
  socialDescriptionEncoded,
  showTryAgainButton,
  onTryAgain,
  showExplorerButton,
  txId,
  isSuccessBeenTrack,
  customContent,
}: TransactionModalProps) => {
  const handlePendingStatus = useCallback(() => {
    const CustomContent = customContent?.[TransactionModalStatus.Pending]

    if (CustomContent) {
      return CustomContent
    }
    return <ConfirmationModalContent title={confirmationTitle} />
  }, [confirmationTitle, customContent])

  const handleWaitingConfirmationStatus = useCallback(() => {
    return <LoadingModalContent title={pendingTitle} showExplorerButton={showExplorerButton} txId={txId} />
  }, [pendingTitle, showExplorerButton, txId])

  const handleErrorStatus = useCallback(() => {
    return (
      <ErrorModalContent
        title={errorTitle}
        description={errorDescription}
        showTryAgainButton={showTryAgainButton}
        onTryAgain={onTryAgain}
        showExplorerButton={showExplorerButton}
        txId={txId}
      />
    )
  }, [errorTitle, errorDescription, showTryAgainButton, onTryAgain, showExplorerButton, txId])

  const handleSuccessStatus = useCallback(() => {
    const CustomContent = customContent?.[TransactionModalStatus.Success]

    if (CustomContent) {
      return CustomContent
    }

    return (
      <SuccessModalContent
        title={successTitle}
        showSocialButtons={showSocialButtons}
        socialDescriptionEncoded={socialDescriptionEncoded}
        showExplorerButton={showExplorerButton}
        txId={txId}
        isSuccessBeenTrack={isSuccessBeenTrack}
      />
    )
  }, [
    customContent,
    isSuccessBeenTrack,
    showExplorerButton,
    showSocialButtons,
    socialDescriptionEncoded,
    successTitle,
    txId,
  ])

  const handleReadyStatus = useCallback(() => {
    return <ConfirmationModalContent title={"Transaction Ready"} description="" />
  }, [])

  const handleUnknownStatus = useCallback(() => {
    return <ConfirmationModalContent title={"Unknown Status"} description="" />
  }, [])

  const modalContent = useMemo(() => {
    const statusComponentMap: Record<TransactionModalStatus, ReactNode> = {
      [TransactionModalStatus.UploadingMetadata]: <UploadingMetadataModalContent />,
      [TransactionModalStatus.Pending]: handlePendingStatus(),
      [TransactionModalStatus.WaitingConfirmation]: handleWaitingConfirmationStatus(),
      [TransactionModalStatus.Error]: handleErrorStatus(),
      [TransactionModalStatus.Success]: handleSuccessStatus(),
      [TransactionModalStatus.Ready]: handleReadyStatus(),
      [TransactionModalStatus.Unknown]: handleUnknownStatus(),
    }
    return statusComponentMap[status] || null
  }, [
    handleErrorStatus,
    handlePendingStatus,
    handleReadyStatus,
    handleSuccessStatus,
    handleUnknownStatus,
    handleWaitingConfirmationStatus,
    status,
  ])
  if (!modalContent) return null
  return (
    <Modal
      data-testid="transaction-modal"
      isOpen={isOpen}
      onClose={onClose}
      trapFocus={false}
      closeOnOverlayClick={status !== "waitingConfirmation" && status !== "pending"}
      isCentered={true}>
      <ModalOverlay />
      <CustomModalContent maxW={"590px"} minH={"300px"}>
        {modalContent}
      </CustomModalContent>
    </Modal>
  )
}
