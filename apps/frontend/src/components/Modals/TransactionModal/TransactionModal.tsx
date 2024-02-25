import { useMemo } from "react"
import { ConfirmationModal } from "../ConfirmationModal"
import { ErrorModal } from "../ErrorModal"
import { LoadingModal } from "../LoadingModal"
import { SuccessModal } from "../SuccessModal"
import { Modal } from "@chakra-ui/react"

export type TransactionModalProps = {
  isOpen: boolean
  onClose: () => void
  status: string
  pendingTitle?: string
  confirmationTitle?: string
  errorTitle?: string
  successTitle?: string
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
    if (status === "pending") return <ConfirmationModal title={pendingTitle} />
    if (status === "waitingConfirmation") return <LoadingModal title={confirmationTitle} />
    if (status === "error") return <ErrorModal title={errorTitle} />
    if (status === "success")
      return (
        <SuccessModal
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
      closeOnOverlayClick={status !== "waitingConfirmation" && status !== "pending"}>
      {modalContent}
    </Modal>
  )
}
