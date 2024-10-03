import { AddressIcon } from "@/components/AddressIcon"
import { Card, CardBody, VStack, Heading, Text, HStack, Button, Stack } from "@chakra-ui/react"
import { UilCheck, UilTimes } from "@iconscout/react-unicons"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { QualificationBadge } from "./QualificationBadges"

export const PendingDelegation = () => {
  const { t } = useTranslation()
  // TODO: get delegation address from contract
  const delegationAddress = "0x9239488390498394839483948394839483948394"
  const qualified = false
  return (
    <Card variant="baseWithBorder" w="full">
      <CardBody borderRadius="xl">
        <VStack align="stretch" gap={6}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading fontSize="xl" fontWeight="700">
                {t("{{delegationAddress}} wants to delegate you their Voting Qualification", {
                  delegationAddress: humanAddress(delegationAddress, 6, 6),
                })}
              </Heading>
            </HStack>
            <Text color="#6A6A6A" fontSize="md">
              {t("While this account keeps their qualification, you’ll be able to use it to vote.")}
            </Text>
          </VStack>
          <Stack direction={["column", "column", "row"]} justify={"space-between"} bg="#F8F8F8" rounded="xl" p={3}>
            <HStack gap={4}>
              <HStack gap={4}>
                <AddressIcon address={delegationAddress} w={12} h={12} rounded="full" />
                <VStack align="start">
                  <Text fontWeight="600" fontSize={["sm", "sm", "lg"]}>
                    {humanAddress(delegationAddress, 4, 4)}
                  </Text>
                </VStack>
              </HStack>
              <HStack>
                <QualificationBadge qualified={qualified} />
              </HStack>
            </HStack>
            <HStack gap={4}>
              <Button variant={"dangerGhost"} p={3} leftIcon={<UilTimes color="#C84968" />}>
                {t("Reject")}
              </Button>
              <Button variant={"primaryGhost"} p={3} leftIcon={<UilCheck color="#004CFC" />}>
                {t("Accept")}
              </Button>
            </HStack>
          </Stack>
        </VStack>
      </CardBody>
    </Card>
  )
}
