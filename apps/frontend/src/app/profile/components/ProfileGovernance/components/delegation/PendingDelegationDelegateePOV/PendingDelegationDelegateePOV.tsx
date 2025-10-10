import { Card, VStack, Heading, Text, HStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { useGetPendingDelegationsDelegateePOV } from "../../../../../../../api/contracts/vePassport/hooks/useGetPendingDelegationsDelegateePOV"

import { PendingDelegationItemDelegateePOV } from "./components/PendingDelegationItemDelegateePOV"

type Props = {
  address: string
  isConnectedUser: boolean
}
export const PendingDelegationDelegateePOV = ({ address, isConnectedUser }: Props) => {
  const { t } = useTranslation()
  const { data: pendingDelegations, isLoading: isPendingDelegationsLoading } =
    useGetPendingDelegationsDelegateePOV(address)
  if (isPendingDelegationsLoading || !pendingDelegations?.length) return null
  return (
    <Card.Root variant="primary" w="full">
      <Card.Body borderRadius="xl">
        <VStack align="stretch" gap={6}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading textStyle="xl">{t("Pending delegations for voting qualification")}</Heading>
            </HStack>
            <Text color="text.subtle" textStyle="md">
              {t("While this account keeps their qualification, you’ll be able to use it to vote.")}
            </Text>
          </VStack>
          <VStack align="stretch">
            {pendingDelegations?.map((delegationAddress: string) => (
              <PendingDelegationItemDelegateePOV
                address={address}
                isConnectedUser={isConnectedUser}
                key={delegationAddress}
                delegationAddress={delegationAddress}
              />
            ))}
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
