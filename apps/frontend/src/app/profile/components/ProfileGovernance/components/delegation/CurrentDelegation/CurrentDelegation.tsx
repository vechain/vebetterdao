import { Card, VStack, Heading, Text, HStack, Button, Stack, useDisclosure } from "@chakra-ui/react"
import { UilTimes } from "@iconscout/react-unicons"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import { AddressIcon } from "@/components/AddressIcon"

import { useCanUserVote } from "../../../../../../../api/contracts/governance/hooks/useCanUserVote"
import { useGetDelegator } from "../../../../../../../api/contracts/vePassport/hooks/useGetDelegator"
import { QualificationBadge } from "../QualificationBadges"

import { RevokeDelegationDelegateePOVModal } from "./components/RevokeDelegationDelegateePOVModal"

type Props = {
  address: string
  isConnectedUser: boolean
}
export const CurrentDelegation = ({ address, isConnectedUser }: Props) => {
  const { t } = useTranslation()
  const { data: delegatorAddress, isLoading: isDelegatorLoading } = useGetDelegator(address)
  const isDelegated = !isDelegatorLoading && !!delegatorAddress
  const { isPerson, isLoading } = useCanUserVote(address)
  const { data: vnsData } = useVechainDomain(delegatorAddress)
  const domain = vnsData?.domain
  const delegationModal = useDisclosure()
  if (isDelegatorLoading || isLoading || !isDelegated) return null
  return (
    <Card.Root variant="primary" w="full">
      <Card.Body borderRadius="xl">
        <VStack align="stretch" gap={6}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading textStyle="xl">
                {t("You are using {{delegatorAddress}} voting qualification", {
                  delegatorAddress: domain ?? humanAddress(delegatorAddress, 6, 6),
                })}
              </Heading>
            </HStack>
            <Text color="text.subtle" textStyle="md">
              {isPerson
                ? t("While this account keeps their qualification, you’ll be able to use it to vote.")
                : t("This account is not currently qualified to vote.")}
            </Text>
          </VStack>
          <Stack
            direction={["column", "column", "row"]}
            justify={"space-between"}
            bg="#F8F8F8"
            rounded="xl"
            p={3}
            key={delegatorAddress}>
            <Stack direction={["column", "column", "row"]} gap={4}>
              <HStack gap={4}>
                <AddressIcon address={delegatorAddress} w={12} h={12} rounded="full" />
                <VStack align="start" gap={0}>
                  <Text fontWeight="semibold" textStyle={["sm", "sm", "lg"]}>
                    {domain ?? humanAddress(delegatorAddress, 4, 4)}
                  </Text>
                </VStack>
                <QualificationBadge qualified={isPerson} />
              </HStack>
            </Stack>
            <HStack>
              {isConnectedUser && (
                <Button colorPalette="red" variant={"ghost"} p={3} onClick={delegationModal.onOpen}>
                  <UilTimes color="status.negative.primary" />
                  {t("Remove delegation")}
                </Button>
              )}
            </HStack>
          </Stack>
        </VStack>
      </Card.Body>
      <RevokeDelegationDelegateePOVModal modal={delegationModal} delegator={delegatorAddress} />
    </Card.Root>
  )
}
