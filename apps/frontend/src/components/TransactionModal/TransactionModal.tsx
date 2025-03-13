import { ReactNode, useCallback, useMemo } from "react"
import { ConfirmationModalContent } from "./ConfirmationModalContent"
import { ErrorModalContent } from "./ErrorModalContent"
import { LoadingModalContent } from "./LoadingModalContent"
import { SuccessModalContent } from "./SuccessModalContent"
import { Modal, ModalOverlay } from "@chakra-ui/react"
import { CustomModalContent } from "@/components/CustomModalContent"
import { UploadingMetadataModalContent } from ".//UploadingMetadataModalContent"
import { UnknownModalContent } from "./UnknownModalContent"

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
  titles?: Partial<Record<TransactionModalStatus, ReactNode>>
  status: TransactionModalStatus
  errorDescription?: string
  showSocialButtons?: boolean
  socialDescriptionEncoded?: string
  onTryAgain?: () => void
  showExplorerButton?: boolean
  txId?: string
  customContent?: Partial<Record<TransactionModalStatus, ReactNode>>
}

export const TransactionModal = ({
  isOpen,
  onClose,
  status,
  titles,
  errorDescription,
  txId,
  customContent,
  ...rest
}: TransactionModalProps) => {
  const handlePendingStatus = useCallback(() => {
    const CustomContent = customContent?.[TransactionModalStatus.Pending]

    if (CustomContent) {
      return CustomContent
    }
    const customTitle = titles?.[TransactionModalStatus.Pending]

    return <ConfirmationModalContent title={customTitle} />
  }, [customContent, titles])

  const handleWaitingConfirmationStatus = useCallback(() => {
    const customTitle = titles?.[TransactionModalStatus.WaitingConfirmation]
    return <LoadingModalContent title={customTitle} {...rest} txId={txId} />
  }, [titles, txId])

  const handleErrorStatus = useCallback(() => {
    const customTitle = titles?.[TransactionModalStatus.Error]

    return <ErrorModalContent title={customTitle} description={errorDescription} {...rest} txId={txId} />
  }, [titles, errorDescription, txId])

  const handleSuccessStatus = useCallback(() => {
    const CustomContent = customContent?.[TransactionModalStatus.Success]
    const customTitle = titles?.[TransactionModalStatus.Success]

    if (CustomContent) {
      return CustomContent
    }

    return <SuccessModalContent title={customTitle} {...rest} txId={txId} />
  }, [customContent, titles, txId])

  const handleReadyStatus = useCallback(() => {
    const customTitle = titles?.[TransactionModalStatus.Ready]
    //TODO: It need a modal only for ready status
    return <ConfirmationModalContent title={customTitle ?? "Transaction Ready"} description="" />
  }, [titles])

  const handleUnknownStatus = useCallback(() => {
    const customTitle = titles?.[TransactionModalStatus.Unknown]
    return <UnknownModalContent title={customTitle} />
  }, [titles])

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
