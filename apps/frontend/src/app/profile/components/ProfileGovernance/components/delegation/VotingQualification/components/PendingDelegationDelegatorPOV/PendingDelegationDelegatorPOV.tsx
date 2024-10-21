import { VStack, Heading, Text, HStack, Divider } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { PendingDelegationItemDelegatorPOV } from "./components/PendingDelegationItemDelegatorPOV"
import { useGetUserPendingDelegationsDelegatorPOV } from "@/api/contracts/vePassport/hooks/useGetPendingDelegationsDelegatorPOV"

export const PendingDelegationDelegatorPOV = () => {
  const { t } = useTranslation()
  const { data: delegateeAddress, isLoading: isPendingDelegationsLoading } = useGetUserPendingDelegationsDelegatorPOV()
  if (isPendingDelegationsLoading || !delegateeAddress || Number(delegateeAddress) === 0) return null
  return (
    <>
      <Divider />
      <VStack align="stretch" gap={6}>
        <VStack align="stretch">
          <HStack justify="space-between">
            <Heading fontSize="xl" fontWeight="700">
              {t("You’ve requested to delegate your qualification")}
            </Heading>
          </HStack>
          <Text color="#6A6A6A" fontSize="md">
            {t("You will not able to vote when the user accept your request.")}
          </Text>
        </VStack>
        <VStack align="stretch">
          <PendingDelegationItemDelegatorPOV key={delegateeAddress} delegationAddress={delegateeAddress} />
        </VStack>
      </VStack>
    </>
  )
}
