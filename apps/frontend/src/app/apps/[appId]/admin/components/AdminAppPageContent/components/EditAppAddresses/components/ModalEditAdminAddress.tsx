import { CustomModalContent, ExclamationTriangle } from "@/components"
import {
  Box,
  Button,
  Heading,
  Modal,
  ModalBody,
  ModalOverlay,
  Text,
  VStack,
  useBreakpointValue,
} from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

type Props = {
  handleEditAdminAddress: () => void
  onClose: () => void
  isOpen: boolean
}

export const ModalEditAdminAddress = ({ handleEditAdminAddress, onClose, isOpen }: Props) => {
  const { t } = useTranslation()
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"xl"}>
      <ModalOverlay />
      <CustomModalContent>
        <ModalBody p={"40px"}>
          <VStack align="center" gap="20px">
            <ExclamationTriangle color="#D23F63" size={useBreakpointValue({ base: 150, sm: 230 })} />
            <Heading fontSize={["22px", "28px"]} fontWeight={700} textAlign={"center"}>
              {t("Change admin address")}
            </Heading>
            <Box textAlign={"center"}>
              <Text as="span" color="#6A6A6A">
                {t(
                  "This address belongs to the App administrator. If you change it, you will not be able to access this configuration anymore. ",
                )}
              </Text>
              <Text as="span" fontWeight={600} color="#6A6A6A">
                {t("Are you absolutely sure you want to edit it?")}
              </Text>
            </Box>
            <VStack align="center" gap="20px">
              <Button variant="primaryAction" onClick={onClose}>
                {t("No, go back")}
              </Button>
              <Button variant="dangerGhost" onClick={handleEditAdminAddress}>
                {t("Yes, I'm sure")}
              </Button>
            </VStack>
          </VStack>
        </ModalBody>
      </CustomModalContent>
    </Modal>
  )
}
