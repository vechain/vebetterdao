import { PeopleIcon } from "@/components"
import { Flex, VStack, Button, Text, Heading, useDisclosure } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LinkAccountModal } from "./components/LinkAccountModal"
import { useAccountLinking } from "@/api"

export const NoLinkedAccount = () => {
  const { t } = useTranslation()
  const addLinkedAccountModal = useDisclosure()
  const { isLoading, isLinked, outgoingPendingLink } = useAccountLinking()

  if (isLoading || isLinked || outgoingPendingLink) return null
  return (
    <Flex align="center" justify="center" w="full" minH="80">
      <VStack gap={4}>
        <PeopleIcon color="#757575" size="105" />
        <Heading fontSize="xl" fontWeight="500" textAlign="center">
          {t("You have not any linked account")}
        </Heading>
        <Text fontSize="sm" color="#757575" textAlign="center">
          {t("You can merge several secondary accounts with your main one")}
        </Text>
        <Button variant="primaryAction" onClick={addLinkedAccountModal.onOpen}>
          {t("Link Accounts")}
        </Button>
        <LinkAccountModal modal={addLinkedAccountModal} />
      </VStack>
    </Flex>
  )
}
