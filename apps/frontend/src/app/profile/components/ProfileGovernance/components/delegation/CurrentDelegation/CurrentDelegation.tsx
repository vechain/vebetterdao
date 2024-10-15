import { AddressIcon } from "@/components/AddressIcon"
import { Card, CardBody, VStack, Heading, Text, HStack, Button, Stack, useDisclosure } from "@chakra-ui/react"
import { UilTimes } from "@iconscout/react-unicons"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { RevokeDelegationDelegateePOVModal } from "./components/RevokeDelegationDelegateePOVModal"
import { QualificationBadge } from "../QualificationBadges"
import { useGetUserDelegator, useUserScore } from "@/api"

export const CurrentDelegation = () => {
  const { t } = useTranslation()
  const { data: delegatorAddress, isLoading: isDelegatorLoading } = useGetUserDelegator()
  const isDelegated = !isDelegatorLoading && !!Number(delegatorAddress)
  const { isUserQualified: isDelegatorQualified, isLoading: isScoreLoading } = useUserScore()

  const delegationModal = useDisclosure()

  if (isDelegatorLoading || isScoreLoading || !isDelegated) return null

  return (
    <Card variant="baseWithBorder" w="full">
      <CardBody borderRadius="xl">
        <VStack align="stretch" gap={6}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading fontSize="xl" fontWeight="700">
                {t("You are using {{delegatorAddress}} voting qualification", {
                  delegatorAddress: humanAddress(delegatorAddress, 6, 6),
                })}
              </Heading>
            </HStack>
            <Text color="#6A6A6A" fontSize="md">
              {isDelegatorQualified
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
                  <Text fontWeight="600" fontSize={["sm", "sm", "lg"]}>
                    {humanAddress(delegatorAddress, 4, 4)}
                  </Text>
                </VStack>
                <QualificationBadge qualified={isDelegatorQualified} />
              </HStack>
            </Stack>
            <HStack>
              <Button
                variant={"dangerGhost"}
                p={3}
                leftIcon={<UilTimes color="#C84968" />}
                onClick={delegationModal.onOpen}>
                {t("Remove delegation")}
              </Button>
            </HStack>
          </Stack>
        </VStack>
      </CardBody>
      <RevokeDelegationDelegateePOVModal modal={delegationModal} delegator={delegatorAddress} />
    </Card>
  )
}
