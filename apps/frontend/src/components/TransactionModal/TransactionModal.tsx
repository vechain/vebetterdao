import { ReactNode, useMemo } from "react"
import { ConfirmationModalContent } from "./ConfirmationModalContent"
import { ErrorModalContent } from "./ErrorModalContent"
import { LoadingModalContent } from "./LoadingModalContent"
import { SuccessModalContent } from "./SuccessModalContent"
import { Modal, ModalOverlay } from "@chakra-ui/react"
import { CustomModalContent } from "@/components/CustomModalContent"
import { UnknownModalContent } from "./UnknownModalContent"

export type TransactionModalProps = {
  isOpen: boolean
  onClose: () => void
  status: string
  pendingTitle?: ReactNode
  confirmationTitle?: ReactNode
  errorTitle?: ReactNode
  successTitle?: ReactNode
  unknownTitle?: ReactNode
  unknownDescription?: ReactNode
  showSocialButtons?: boolean
  socialDescriptionEncoded?: string
  showTryAgainButton?: boolean
  onTryAgain?: () => void
  showExplorerButton?: boolean
  txId?: string
}

export const TransactionModal = ({
  isOpen,
  onClose,
  status,
  pendingTitle,
  confirmationTitle,
  errorTitle,
  successTitle,
  showSocialButtons = false,
  socialDescriptionEncoded,
  showTryAgainButton,
  onTryAgain,
  showExplorerButton,
  txId,
  unknownTitle,
  unknownDescription,
}: TransactionModalProps) => {
  const modalContent = useMemo(() => {
    if (status === "unknown")
      return (
        <UnknownModalContent
          title={unknownTitle}
          description={unknownDescription}
          txId={txId}
          showExplorerButton={showExplorerButton}
        />
      )
    if (status === "pending") return <ConfirmationModalContent title={confirmationTitle} />
    if (status === "waitingConfirmation")
      return <LoadingModalContent title={pendingTitle} showExplorerButton={showExplorerButton} txId={txId} />
    if (status === "error")
      return (
        <ErrorModalContent
          title={errorTitle}
          showTryAgainButton={showTryAgainButton}
          onTryAgain={onTryAgain}
          showExplorerButton={showExplorerButton}
          txId={txId}
        />
      )
    if (status === "success")
      return (
        <SuccessModalContent
          title={successTitle}
          showSocialButtons={showSocialButtons}
          socialDescriptionEncoded={socialDescriptionEncoded}
          showExplorerButton={showExplorerButton}
          txId={txId}
        />
      )
    return null
  }, [status, pendingTitle, confirmationTitle, errorTitle, successTitle, showSocialButtons, socialDescriptionEncoded])
  if (!modalContent) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      trapFocus={false}
      closeOnOverlayClick={status !== "waitingConfirmation" && status !== "pending"}
      isCentered={true}>
      <ModalOverlay />
      <CustomModalContent>{modalContent}</CustomModalContent>
    </Modal>
  )
}
