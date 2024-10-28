import { Button, Stack, useDisclosure } from "@chakra-ui/react"

import { useGetDelegatee } from "@/api"
import { AddressIcon } from "@/components/AddressIcon"
import { Divider, HStack, Heading, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { UilTimes } from "@iconscout/react-unicons"
import { RevokeDelegationDelegatorPOVModal } from "./components/RevokeDelegationDelegatorPOVModal"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/dapp-kit-react"

type Props = {
  address: string
}
export const DelegatorDelegations = ({ address }: Props) => {
  const { t } = useTranslation()

  const { account: connectedAccount } = useWallet()
  const isConnectedUser = compareAddresses(connectedAccount ?? "", address)

  const { data: delegateeAddress, isLoading: isDelegateeLoading } = useGetDelegatee(address)
  const isDelegator = !isDelegateeLoading && !!Number(delegateeAddress)

  const revokeDelegationModal = useDisclosure()

  if (!isDelegator) return null
  return (
    <>
      <Divider />
      <VStack align="stretch" gap={6}>
        <VStack align="stretch">
          <HStack justify="space-between">
            <Heading fontSize="xl" fontWeight="700">
              {t("You’ve delegated your qualification")}
            </Heading>
          </HStack>
          <Text color="#6A6A6A" fontSize="md">
            {t("You are not currently able to vote due other user is using your Voting Qualification.")}
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
              <Text fontWeight="600" fontSize={["sm", "sm", "lg"]}>
                {humanAddress(delegateeAddress, 4, 4)}
              </Text>
            </VStack>
          </HStack>
          <HStack>
            {isConnectedUser && (
              <Button
                variant={"dangerGhost"}
                p={3}
                leftIcon={<UilTimes color="#C84968" />}
                onClick={revokeDelegationModal.onOpen}>
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
