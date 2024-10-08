import { useTranslation } from "react-i18next"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { AddressIcon } from "@/components/AddressIcon"
import { RemoveDelegationModal } from "./RemoveDelegationModal"
import { Stack, HStack, VStack, Text, Button, useDisclosure } from "@chakra-ui/react"
import { UilTimes } from "@iconscout/react-unicons"

export const PendingDelegationItemDelegatorPOV = ({ delegationAddress }: { delegationAddress: string }) => {
  const { t } = useTranslation()
  const removeDelegationModal = useDisclosure()

  return (
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
      </HStack>
      <HStack gap={4}>
        <Button
          variant={"dangerGhost"}
          p={3}
          leftIcon={<UilTimes color="#C84968" />}
          onClick={removeDelegationModal.onOpen}>
          {t("Remove")}
        </Button>
      </HStack>
      <RemoveDelegationModal modal={removeDelegationModal} delegator={delegationAddress} />
    </Stack>
  )
}
