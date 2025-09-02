import { useAccountLinking } from "@/api"
import { Card, VStack, Heading, Text, HStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { PendingLinkingProposalItem } from "./components/PendingLinkingProposalItem/PendingLinkingProposalItem"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"

type Props = {
  address: string
}
export const PendingLinkingProposal = ({ address }: Props) => {
  const { t } = useTranslation()

  const { account: connectedAccount } = useWallet()
  const isConnectedUser = compareAddresses(connectedAccount?.address ?? "", address)

  const { incomingPendingLinkings, isLoading } = useAccountLinking(address)
  if (isLoading || !incomingPendingLinkings?.length) return null
  return (
    <Card.Root variant="baseWithBorder" w="full">
      <Card.Body borderRadius="xl">
        <VStack align="stretch" gap={6}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading textStyle="xl">{t("These accounts want to become secondary accounts")}</Heading>
            </HStack>
            <Text color="text.subtle" textStyle="md">
              {isConnectedUser
                ? t("Their actions will be attributed to your main account.")
                : t("Their actions will be attributed to user's main account.")}
            </Text>
          </VStack>
          <VStack align="stretch">
            {incomingPendingLinkings.map((secondaryAccount: string) => (
              <PendingLinkingProposalItem
                isConnectedUser={isConnectedUser}
                key={secondaryAccount}
                secondaryAccount={secondaryAccount}
              />
            ))}
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
