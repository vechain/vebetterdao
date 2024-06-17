import { Button, Heading, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { UilPlus } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

export const EditAppModerators = () => {
  const { t } = useTranslation()
  const addModeratorModal = useDisclosure()
  return (
    <VStack align="stretch">
      <Heading fontSize={"24px"} fontWeight={700}>
        {t("Moderators")}
      </Heading>
      <Text color="#6A6A6A">
        {t(
          "Your dApp's page doesn't have moderators yet. Add someone to assist you in handling the information on the page and the feed.",
        )}
      </Text>
      <Button
        mt={4}
        onClick={addModeratorModal.onOpen}
        variant="primarySubtle"
        leftIcon={<UilPlus size="14px" />}
        alignSelf={"flex-start"}>
        {t("Add Moderator")}
      </Button>
    </VStack>
  )
}
