import { CustomModalContent } from "@/components"
import { ErrorModalContent } from "@/components/TransactionModal/ErrorModalContent"
import { SuccessModalContent } from "@/components/TransactionModal/SuccessModalContent"
import { Modal, ModalOverlay, VStack, Button } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"

import { useTranslation } from "react-i18next"

type CreatorApplicationModalProps = {
  isOpen: boolean
  onClose: () => void
  onButtonClick: () => void
  status: "success" | "error"
  errorMessage?: string
}

export const CreatorApplicationModal: React.FC<CreatorApplicationModalProps> = ({
  isOpen,
  onClose,
  onButtonClick,
  status,
  errorMessage,
}) => {
  const handleClose = useCallback(() => {
    onClose()
    if (status === "success") {
      onButtonClick()
    }
  }, [onClose, status, onButtonClick])

  const { t } = useTranslation()
  const modalContent = useMemo(() => {
    if (status === "error" || errorMessage) {
      return (
        <Modal isOpen={isOpen} onClose={handleClose} trapFocus={true} isCentered={true}>
          <ModalOverlay />
          <CustomModalContent>
            <ErrorModalContent title={t("Error submitting form")} description={errorMessage} />
          </CustomModalContent>
        </Modal>
      )
    }
    return (
      <>
        <SuccessModalContent title={t("Your application has been submitted")} onClose={handleClose} />
        <VStack spacing={4} align="center" p={5}>
          <Button variant="primaryAction" onClick={onButtonClick}>
            {t("Go back to VeBetterDAO")}
          </Button>
        </VStack>
      </>
    )
  }, [status, errorMessage, isOpen, handleClose, onButtonClick, t])
  return (
    <Modal isOpen={isOpen} onClose={handleClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <CustomModalContent>{modalContent}</CustomModalContent>
    </Modal>
  )
}
