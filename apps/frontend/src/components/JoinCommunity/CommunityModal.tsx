import { Card, CardBody, Modal, ModalCloseButton, ModalOverlay, VStack, Text } from "@chakra-ui/react"
import { CustomModalContent } from "../CustomModalContent"
import { useCallback } from "react"
import { DiscordButton, FreshDeskButton, TelegramButton } from "../Footer"
import { useTranslation } from "react-i18next"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const CommunityModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()

  const renderCardContent = useCallback(() => {
    return (
      <CardBody>
        <ModalCloseButton top={6} right={4} />
        <Text fontSize={20} fontWeight={700}>
          {t("Join Our Community!")}
        </Text>
        <VStack align={"flex-start"} maxW={"590px"} minW={{ base: "90vw", md: "350px" }} px={4} spacing={2} mt={8}>
          <DiscordButton isFullWidth />
          <TelegramButton isFullWidth />
          <FreshDeskButton isFullWidth />
        </VStack>
      </CardBody>
    )
  }, [t])

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <CustomModalContent w={"auto"} maxW={"container.md"}>
        <Card rounded={20}>{renderCardContent()}</Card>
      </CustomModalContent>
    </Modal>
  )
}
