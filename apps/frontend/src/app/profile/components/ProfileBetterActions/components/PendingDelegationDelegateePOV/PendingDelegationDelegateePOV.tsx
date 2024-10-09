import { Card, CardBody, VStack, Heading, Text, HStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { PendingDelegationItemDelegateePOV } from "./components/PendingDelegationItemDelegateePOV"
import { useGetUserPendingDelegationsDelegateePOV } from "@/api"

export const PendingDelegationDelegateePOV = () => {
  const { t } = useTranslation()
  const { data: pendingDelegations, isLoading: isPendingDelegationsLoading } =
    useGetUserPendingDelegationsDelegateePOV()
  if (isPendingDelegationsLoading || pendingDelegations?.length === 0) return null

  return (
    <Card variant="baseWithBorder" w="full">
      <CardBody borderRadius="xl">
        <VStack align="stretch" gap={6}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading fontSize="xl" fontWeight="700">
                {t("Pending delegations for voting qualification")}
              </Heading>
            </HStack>
            <Text color="#6A6A6A" fontSize="md">
              {t("While this account keeps their qualification, you’ll be able to use it to vote.")}
            </Text>
          </VStack>
          <VStack align="stretch">
            {pendingDelegations?.map((delegationAddress: string) => (
              <PendingDelegationItemDelegateePOV key={delegationAddress} delegationAddress={delegationAddress} />
            ))}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
