import { Stack, HStack, VStack, Text, Button, Badge, useDisclosure } from "@chakra-ui/react"
import { UilCheck, UilTimes } from "@iconscout/react-unicons"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import { AddressIcon } from "@/components/AddressIcon"

import { AcceptLinkingModal } from "./components/AcceptLinkingModal"
import { RejectLinkingModal } from "./components/RejectLinkingModal"

type Props = { isConnectedUser: boolean; secondaryAccount: string }
export const PendingLinkingProposalItem = ({ isConnectedUser, secondaryAccount }: Props) => {
  const { t } = useTranslation()
  const { data: vnsData } = useVechainDomain(secondaryAccount || "")
  const domain = vnsData?.domain
  const rejectLinkingModal = useDisclosure()
  const acceptLinkingModal = useDisclosure()
  return (
    <Stack
      direction={["column", "column", "row"]}
      justify={"space-between"}
      bg="#F8F8F8"
      rounded="xl"
      p={3}
      boxShadow={"0px 0px 7.9px 0px rgba(242, 155, 50, 0.50)"}>
      <HStack gap={4}>
        <HStack gap={4}>
          <AddressIcon address={secondaryAccount} w={12} h={12} rounded="full" />
          <VStack align="start">
            <HStack>
              {domain && (
                <Text
                  fontWeight="semibold"
                  textStyle={["sm", "sm", "lg"]}
                  borderRight={"1px solid"}
                  paddingRight={2}
                  lineClamp={1}
                  title={domain}>
                  {humanDomain(domain, 8, 4)}
                </Text>
              )}
              <Text fontWeight="semibold" textStyle={["sm", "sm", "lg"]} title={secondaryAccount}>
                {humanAddress(secondaryAccount, 4, 4)}
              </Text>
            </HStack>
          </VStack>
          <Badge color="white" bg={"#F29B32"} borderRadius="full" px="12px" py="4px" textTransform={"inherit"}>
            {t("Pending")}
          </Badge>
        </HStack>
      </HStack>
      {isConnectedUser && (
        <HStack gap={4}>
          <Button colorPalette="red" variant={"ghost"} flex={1} p={3} onClick={rejectLinkingModal.onOpen}>
            <UilTimes color="status.negative.primary" />
            {t("Reject")}
          </Button>
          <Button variant="ghost" color="actions.tertiary.default" flex={1} p={3} onClick={acceptLinkingModal.onOpen}>
            <UilCheck color="#004CFC" />
            {t("Accept")}
          </Button>
        </HStack>
      )}
      <AcceptLinkingModal modal={acceptLinkingModal} secondaryAccount={secondaryAccount} />
      <RejectLinkingModal modal={rejectLinkingModal} secondaryAccount={secondaryAccount} />
    </Stack>
  )
}
