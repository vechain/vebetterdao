import { PeopleIcon } from "@/components"
import { Flex, VStack, Button, Text, Heading, useDisclosure } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LinkAccountModal } from "./components/LinkAccountModal"
import { useAccountLinking } from "@/api"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"

type Props = {
  address: string
}
export const NoLinkedAccount = ({ address }: Props) => {
  const { t } = useTranslation()
  const addLinkedAccountModal = useDisclosure()
  const { isLoading, isLinked, outgoingPendingLink } = useAccountLinking(address)

  const { account: connectedAccount } = useWallet()
  const isConnectedUser = compareAddresses(connectedAccount?.address ?? "", address)

  if (isLoading || isLinked || outgoingPendingLink) return null
  return (
    <Flex align="center" justify="center" w="full" minH="80">
      <VStack gap={4}>
        <PeopleIcon color="#757575" size="105" />
        <Heading textStyle="xl" fontWeight="semibold" textAlign="center">
          {isConnectedUser ? t("You have no linked accounts") : t("No linked accounts")}
        </Heading>
        <Text textStyle="sm" color="#757575" textAlign="center">
          {isConnectedUser
            ? t("You can merge several secondary accounts with your main one")
            : t("Several secondary accounts can be merged with the user's account.")}
        </Text>
        {isConnectedUser && (
          <Button variant="primary" onClick={addLinkedAccountModal.onOpen}>
            {t("Link Accounts")}
          </Button>
        )}
        <LinkAccountModal modal={addLinkedAccountModal} />
      </VStack>
    </Flex>
  )
}
