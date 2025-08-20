import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

interface UnsavedChangesModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveDraft: () => void
  onLeaveAnyway: () => void
  projectName?: string
}

export const UnsavedChangesModal = ({
  isOpen,
  onClose,
  onSaveDraft,
  onLeaveAnyway,
  projectName,
}: UnsavedChangesModalProps) => {
  const { t } = useTranslation()

  const handleSaveDraft = () => {
    onSaveDraft()
  }

  const handleLeaveAnyway = () => {
    onLeaveAnyway()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t("Unsaved Changes")}</ModalHeader>
        <ModalBody>
          <Text>
            {projectName
              ? t("You have unsaved changes to '{{projectName}}'. What would you like to do?", {
                  projectName,
                })
              : t("You have unsaved changes. What would you like to do?")}
          </Text>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="secondary" onClick={handleLeaveAnyway}>
            {t("Leave anyway")}
          </Button>
          <Button variant="primaryAction" onClick={handleSaveDraft}>
            {t("Save draft")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
