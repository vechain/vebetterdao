import { ReactNode, useMemo } from "react"
import { ConfirmationModalContent } from "./ConfirmationModalContent"
import { ErrorModalContent } from "./ErrorModalContent"
import { LoadingModalContent } from "./LoadingModalContent"
import { SuccessModalContent } from "./SuccessModalContent"
import { Modal, ModalOverlay } from "@chakra-ui/react"
import { CustomModalContent } from "@/components/CustomModalContent"
import { UploadingMetadataModalContent } from ".//UploadingMetadataModalContent"
import { ConfirmationConvertModalContent } from "./ConfirmationConvertModalContent"
import { SuccessConvertModalContent } from "./SuccessConvertModalContent"

export type TransactionModalProps = {
  isOpen: boolean
  onClose: () => void
  status: string
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
  b3trBalanceAfterSwap?: string
  vot3BalanceAfterSwap?: string
  isSwap?: boolean
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
  isSwap,
  b3trBalanceAfterSwap,
  vot3BalanceAfterSwap,
}: TransactionModalProps) => {
  const modalContent = useMemo(() => {
    if (status === "uploadingMetadata") return <UploadingMetadataModalContent />

    if (status === "pending")
      return isSwap ? (
        <ConfirmationConvertModalContent
          b3trBalanceAfter={b3trBalanceAfterSwap}
          vot3BalanceAfter={vot3BalanceAfterSwap}
        />
      ) : (
        <ConfirmationModalContent title={confirmationTitle} />
      )
    if (status === "waitingConfirmation")
      return <LoadingModalContent title={pendingTitle} showExplorerButton={showExplorerButton} txId={txId} />
    if (status === "error")
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
    if (status === "success")
      return isSwap ? (
        <SuccessConvertModalContent
          b3trBalanceAfter={b3trBalanceAfterSwap}
          vot3BalanceAfter={vot3BalanceAfterSwap}
          txId={txId}
          onClose={onClose}
        />
      ) : (
        <SuccessModalContent
          title={successTitle}
          showSocialButtons={showSocialButtons}
          socialDescriptionEncoded={socialDescriptionEncoded}
          showExplorerButton={showExplorerButton}
          txId={txId}
        />
      )
    return null
  }, [
    status,
    isSwap,
    b3trBalanceAfterSwap,
    vot3BalanceAfterSwap,
    confirmationTitle,
    pendingTitle,
    showExplorerButton,
    txId,
    errorTitle,
    errorDescription,
    showTryAgainButton,
    onTryAgain,
    onClose,
    successTitle,
    showSocialButtons,
    socialDescriptionEncoded,
  ])
  if (!modalContent) return null

  return (
    <Modal
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
