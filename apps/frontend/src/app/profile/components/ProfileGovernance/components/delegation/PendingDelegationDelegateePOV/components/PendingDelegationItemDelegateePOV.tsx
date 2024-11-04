import { useTranslation } from "react-i18next"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { AddressIcon } from "@/components/AddressIcon"
import { AcceptDelegationModal } from "./AcceptDelegationModal"
import { RejectDelegationModal } from "./RejectDelegationModal"
import { Stack, HStack, VStack, Text, Button, useDisclosure } from "@chakra-ui/react"
import { QualificationBadge } from "../../QualificationBadges"
import { UilCheck, UilTimes } from "@iconscout/react-unicons"
import { useUserScore } from "@/api"

export const PendingDelegationItemDelegateePOV = ({ delegationAddress }: { delegationAddress: string }) => {
  const { t } = useTranslation()
  const { isUserQualified: isDelegatorQualified, isLoading: isScoreLoading } = useUserScore(delegationAddress)

  const acceptDelegationModal = useDisclosure()
  const rejectDelegationModal = useDisclosure()

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
        {!isScoreLoading && (
          <HStack>
            <QualificationBadge qualified={isDelegatorQualified} />
          </HStack>
        )}
      </HStack>
      <HStack gap={4}>
        <Button
          variant={"dangerGhost"}
          p={3}
          leftIcon={<UilTimes color="#C84968" />}
          onClick={rejectDelegationModal.onOpen}>
          {t("Reject")}
        </Button>
        <Button
          variant={"primaryGhost"}
          p={3}
          leftIcon={<UilCheck color="#004CFC" />}
          onClick={acceptDelegationModal.onOpen}>
          {t("Accept")}
        </Button>
      </HStack>
      <AcceptDelegationModal modal={acceptDelegationModal} delegator={delegationAddress} />
      <RejectDelegationModal modal={rejectDelegationModal} delegator={delegationAddress} />
    </Stack>
  )
}
