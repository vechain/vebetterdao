import { VStack, Heading, Text, HStack, Separator } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import { useGetPendingDelegationsDelegatorPOV } from "@/api/contracts/vePassport/hooks/useGetPendingDelegationsDelegatorPOV"

import { PendingDelegationItemDelegatorPOV } from "./components/PendingDelegationItemDelegatorPOV"

type Props = {
  address: string
}
export const PendingDelegationDelegatorPOV = ({ address }: Props) => {
  const { t } = useTranslation()
  const { account: connectedAccount } = useWallet()
  const isConnectedUser = compareAddresses(connectedAccount?.address ?? "", address)
  const { data: delegateeAddress, isLoading: isPendingDelegationsLoading } =
    useGetPendingDelegationsDelegatorPOV(address)
  if (isPendingDelegationsLoading || !delegateeAddress || Number(delegateeAddress) === 0) return null
  return (
    <>
      <Separator />
      <VStack align="stretch" gap={6}>
        <VStack align="stretch">
          <HStack justify="space-between">
            <Heading textStyle="xl">
              {t(
                isConnectedUser
                  ? "You’ve requested to delegate your qualification"
                  : "This user requested to delegate their qualification",
              )}
            </Heading>
          </HStack>
          <Text color="text.subtle" textStyle="md">
            {t(
              isConnectedUser
                ? "You will not able to vote when the user accept your request."
                : "This user will not able to vote when the recipient accepts their request.",
            )}
          </Text>
        </VStack>
        <VStack align="stretch">
          <PendingDelegationItemDelegatorPOV
            isConnectedUser={isConnectedUser}
            key={delegateeAddress}
            delegationAddress={delegateeAddress}
          />
        </VStack>
      </VStack>
    </>
  )
}
