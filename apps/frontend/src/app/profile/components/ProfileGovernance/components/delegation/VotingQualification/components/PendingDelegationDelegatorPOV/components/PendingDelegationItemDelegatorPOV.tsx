import { Stack, HStack, VStack, Text, Button, useDisclosure, Badge } from "@chakra-ui/react"
import { UilTimes } from "@iconscout/react-unicons"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import { AddressIcon } from "@/components/AddressIcon"

import { RemoveDelegationModal } from "./RemoveDelegationModal"

type Props = {
  delegationAddress: string
  isConnectedUser: boolean
}
export const PendingDelegationItemDelegatorPOV = ({ delegationAddress, isConnectedUser }: Props) => {
  const { t } = useTranslation()
  const removeDelegationModal = useDisclosure()
  const { data: vnsData } = useVechainDomain(delegationAddress)
  const domain = vnsData?.domain
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
          <AddressIcon address={delegationAddress} w={12} h={12} rounded="full" />
          <VStack align="start">
            <Text fontWeight="semibold" textStyle={["sm", "sm", "lg"]}>
              {domain ?? humanAddress(delegationAddress, 4, 4)}
            </Text>
          </VStack>
          <Badge color="white" bg={"#F29B32"} borderRadius="full" px="12px" py="4px" textTransform={"inherit"}>
            {t("Pending")}
          </Badge>
        </HStack>
      </HStack>
      <HStack gap={4}>
        {isConnectedUser && (
          <Button variant={"ghost"} colorPalette="red" p={3} onClick={removeDelegationModal.onOpen}>
            <UilTimes color="status.negative.primary" />
            {t("Cancel request")}
          </Button>
        )}
      </HStack>
      <RemoveDelegationModal modal={removeDelegationModal} delegatee={delegationAddress} />
    </Stack>
  )
}
