import { VStack, Heading, Text, HStack, Separator } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { PendingDelegationItemDelegatorPOV } from "./components/PendingDelegationItemDelegatorPOV"
import { useGetPendingDelegationsDelegatorPOV } from "@/api/contracts/vePassport/hooks/useGetPendingDelegationsDelegatorPOV"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"

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
            <Heading fontSize="xl" fontWeight="700">
              {t(
                isConnectedUser
                  ? "You’ve requested to delegate your qualification"
                  : "This user requested to delegate their qualification",
              )}
            </Heading>
          </HStack>
          <Text color="#6A6A6A" fontSize="md">
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
