import { Separator, HStack, Heading, Text, VStack, Button, Stack, useDisclosure } from "@chakra-ui/react"
import { UilTimes } from "@iconscout/react-unicons"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useWallet, useVechainDomain } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import { useGetDelegatee } from "../../../../../../../../../api/contracts/vePassport/hooks/useGetDelegatee"

import { RevokeDelegationDelegatorPOVModal } from "./components/RevokeDelegationDelegatorPOVModal"

import { AddressIcon } from "@/components/AddressIcon"

type Props = {
  address: string
}
export const DelegatorDelegations = ({ address }: Props) => {
  const { t } = useTranslation()
  const { account: connectedAccount } = useWallet()
  const isConnectedUser = compareAddresses(connectedAccount?.address ?? "", address)
  const { data: delegateeAddress, isLoading: isDelegateeLoading } = useGetDelegatee(address)
  const isDelegator = !isDelegateeLoading && !!delegateeAddress
  const { data: vnsData } = useVechainDomain(delegateeAddress)
  const delegateeDomain = vnsData?.domain
  const revokeDelegationModal = useDisclosure()
  if (!isDelegator) return null
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
                ? "You are not currently able to vote due other user is using your Voting Qualification."
                : "This user is not currently able to vote due other user is using their Voting Qualification.",
            )}
          </Text>
        </VStack>
        <Stack
          direction={["column", "column", "row"]}
          justify={"space-between"}
          bg="#F8F8F8"
          rounded="xl"
          p={3}
          gap={[2, 2, 6]}>
          <HStack gap={4}>
            <AddressIcon address={delegateeAddress} w={12} h={12} rounded="full" />
            <VStack align="start" gap={0}>
              <Text fontWeight="semibold" textStyle={["sm", "sm", "lg"]}>
                {delegateeDomain ? humanDomain(delegateeDomain, 4, 26) : humanAddress(delegateeAddress, 4, 4)}
              </Text>
            </VStack>
          </HStack>
          <HStack>
            {isConnectedUser && (
              <Button variant={"ghost"} colorPalette="red" p={3} onClick={revokeDelegationModal.onOpen}>
                <UilTimes color="status.negative.primary" />
                {t("Remove delegation")}
              </Button>
            )}
          </HStack>
        </Stack>
      </VStack>
      <RevokeDelegationDelegatorPOVModal modal={revokeDelegationModal} delegatee={delegateeAddress} />
    </>
  )
}
