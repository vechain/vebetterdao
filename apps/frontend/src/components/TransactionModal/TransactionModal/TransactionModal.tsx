import { ReactNode, useMemo } from "react"
import { ConfirmationModalContent } from "../ConfirmationModalContent"
import { ErrorModalContent } from "../ErrorModalContent"
import { LoadingModalContent } from "../LoadingModalContent"
import { SuccessModalContent } from "../SuccessModalContent"
import { Modal } from "@chakra-ui/react"

export type TransactionModalProps = {
  isOpen: boolean
  onClose: () => void
  status: string
  pendingTitle?: ReactNode
  confirmationTitle?: ReactNode
  errorTitle?: ReactNode
  successTitle?: ReactNode
  showSocialButtons?: boolean
  socialDescription?: string
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
  socialDescription,
}: TransactionModalProps) => {
  const modalContent = useMemo(() => {
    if (status === "pending") return <ConfirmationModalContent title={confirmationTitle} />
    if (status === "waitingConfirmation") return <LoadingModalContent title={pendingTitle} />
    if (status === "error") return <ErrorModalContent title={errorTitle} />
    if (status === "success")
      return (
        <SuccessModalContent
          title={successTitle}
          showSocialButtons={showSocialButtons}
          socialDescription={socialDescription}
        />
      )
    return null
  }, [status, pendingTitle, confirmationTitle, errorTitle, successTitle, showSocialButtons, socialDescription])
  if (!modalContent) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      trapFocus={false}
      closeOnOverlayClick={status !== "waitingConfirmation" && status !== "pending"}
      isCentered={true}>
      {modalContent}
    </Modal>
  )
}
