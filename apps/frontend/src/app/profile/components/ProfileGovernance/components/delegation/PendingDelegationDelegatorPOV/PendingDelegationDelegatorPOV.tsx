import { Card, CardBody, VStack, Heading, Text, HStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { PendingDelegationItemDelegatorPOV } from "./components/PendingDelegationItemDelegatorPOV"
import { useGetUserPendingDelegationsDelegatorPOV } from "@/api/contracts/vePassport/hooks/useGetPendingDelegationsDelegatorPOV"

export const PendingDelegationDelegatorPOV = () => {
  const { t } = useTranslation()
  const { data: pendingDelegations, isLoading: isPendingDelegationsLoading } =
    useGetUserPendingDelegationsDelegatorPOV()
  if (isPendingDelegationsLoading || pendingDelegations?.length === 0) return null

  return (
    <Card variant="baseWithBorder" w="full">
      <CardBody borderRadius="xl">
        <VStack align="stretch" gap={6}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading fontSize="xl" fontWeight="700">
                {t("Your pending requests to delegate your qualification")}
              </Heading>
            </HStack>
            <Text color="#6A6A6A" fontSize="md">
              {t("While you keep your qualification, they will be able to use your qualification to vote.")}
            </Text>
          </VStack>
          <VStack align="stretch">
            {pendingDelegations?.map((delegationAddress: string) => (
              <PendingDelegationItemDelegatorPOV key={delegationAddress} delegationAddress={delegationAddress} />
            ))}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
