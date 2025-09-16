import { CustomModalContent, ExclamationTriangle } from "@/components"
import { Box, Button, Heading, Dialog, Text, VStack, useBreakpointValue } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

type Props = {
  handleEditAdminAddress: () => void
  onClose: () => void
  open: boolean
}

export const ModalEditAdminAddress = ({ handleEditAdminAddress, onClose, open }: Props) => {
  const { t } = useTranslation()
  return (
    <Dialog.Root open={open} onOpenChange={details => !details.open && onClose()} size={"md"}>
      <CustomModalContent>
        <Dialog.Body p={"40px"}>
          <VStack align="center" gap="20px">
            <ExclamationTriangle color="#D23F63" size={useBreakpointValue({ base: 150, sm: 230 })} />
            <Heading size={["xl", "3xl"]} textAlign={"center"}>
              {t("Change admin address")}
            </Heading>
            <Box textAlign={"center"}>
              <Text as="span" color="text.subtle">
                {t(
                  "This address belongs to the App administrator. If you change it, you will not be able to access this configuration anymore. ",
                )}
              </Text>
              <Text as="span" fontWeight="semibold" color="text.subtle">
                {t("Are you absolutely sure you want to edit it?")}
              </Text>
            </Box>
            <VStack align="center" gap="20px">
              <Button variant="primary" onClick={onClose}>
                {t("No, go back")}
              </Button>
              <Button variant="ghost" color="status.negative.primary" onClick={handleEditAdminAddress}>
                {t("Yes, I'm sure")}
              </Button>
            </VStack>
          </VStack>
        </Dialog.Body>
      </CustomModalContent>
    </Dialog.Root>
  )
}
