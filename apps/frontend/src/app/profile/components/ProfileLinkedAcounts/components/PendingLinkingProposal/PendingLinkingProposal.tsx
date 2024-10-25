import { useAccountLinking } from "@/api"
import { Card, CardBody, VStack, Heading, Text, HStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { PendingLinkingProposalItem } from "./components/PendingLinkingProposalItem/PendingLinkingProposalItem"

type Props = {
  address: string
}
export const PendingLinkingProposal = ({ address }: Props) => {
  const { t } = useTranslation()

  const { incomingPendingLinkings, isLoading } = useAccountLinking(address)
  if (isLoading || !incomingPendingLinkings?.length) return null
  return (
    <Card variant="baseWithBorder" w="full">
      <CardBody borderRadius="xl">
        <VStack align="stretch" gap={6}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading fontSize="xl" fontWeight="700">
                {t("These accounts want to become secondary accounts")}
              </Heading>
            </HStack>
            <Text color="#6A6A6A" fontSize="md">
              {t("Their actions will be attributed to your main account.")}
            </Text>
          </VStack>
          <VStack align="stretch">
            {incomingPendingLinkings.map((secondaryAccount: string) => (
              <PendingLinkingProposalItem key={secondaryAccount} secondaryAccount={secondaryAccount} />
            ))}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
