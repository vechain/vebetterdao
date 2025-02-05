import { CustomModalContent } from "@/components/CustomModalContent"
import { Modal, ModalOverlay, VStack, Heading, Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const TransactionApprovalModal = ({
  isOpen,
  onClose,
  onApprove,
  onReject,
}: {
  isOpen: boolean
  onClose: () => void
  onApprove: () => void
  onReject: () => void
}) => {
  const { t } = useTranslation()

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered={true}>
      <ModalOverlay />
      <CustomModalContent maxW={"590px"} minH={"300px"}>
        <VStack align={"center"} p={6}>
          <Heading size="md"> {t("Confirm this transaction?")}</Heading>
        </VStack>
        <VStack align="center" gap="20px" mt={"20px"}>
          <Button variant="primaryAction" onClick={onApprove}>
            {t("Yes, I'm sure")}
          </Button>
          <Button variant="dangerGhost" onClick={onReject}>
            {t("No, go back")}
          </Button>
        </VStack>
      </CustomModalContent>
    </Modal>
  )
}
