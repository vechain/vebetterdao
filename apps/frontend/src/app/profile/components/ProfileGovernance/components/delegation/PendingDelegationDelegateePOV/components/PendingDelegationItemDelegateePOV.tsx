import { useTranslation } from "react-i18next"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { AddressIcon } from "@/components/AddressIcon"
import { AcceptDelegationModal } from "./AcceptDelegationModal"
import { RejectDelegationModal } from "./RejectDelegationModal"
import { Stack, HStack, VStack, Text, Button, useDisclosure } from "@chakra-ui/react"
import { QualificationBadge } from "../../QualificationBadges"
import { UilCheck, UilTimes } from "@iconscout/react-unicons"
import { useCanUserVote } from "@/api"
import { useVechainDomain } from "@vechain/vechain-kit"

type Props = { address: string; isConnectedUser: boolean; delegationAddress: string }
export const PendingDelegationItemDelegateePOV = ({ address, isConnectedUser, delegationAddress }: Props) => {
  const { t } = useTranslation()
  //TODo: IS this right?
  const { isPerson, isLoading: isScoreLoading } = useCanUserVote(address, delegationAddress)

  const { data: vnsData } = useVechainDomain(delegationAddress)
  const domain = vnsData?.domain

  const acceptDelegationModal = useDisclosure()
  const rejectDelegationModal = useDisclosure()

  return (
    <Stack direction={["column", "column", "row"]} justify={"space-between"} bg="#F8F8F8" rounded="xl" p={3}>
      <HStack gap={4}>
        <HStack gap={4}>
          <AddressIcon address={delegationAddress} w={12} h={12} rounded="full" />
          <VStack align="start">
            <Text fontWeight="600" textStyle={["sm", "sm", "lg"]}>
              {domain ?? humanAddress(delegationAddress, 4, 4)}
            </Text>
          </VStack>
        </HStack>
        {!isScoreLoading && (
          <HStack>
            <QualificationBadge qualified={isPerson} />
          </HStack>
        )}
      </HStack>
      {isConnectedUser && (
        <HStack gap={4}>
          <Button variant={"dangerGhost"} p={3} onClick={rejectDelegationModal.onOpen}>
            <UilTimes color="error.primary" />
            {t("Reject")}
          </Button>
          <Button variant={"primaryGhost"} p={3} onClick={acceptDelegationModal.onOpen}>
            <UilCheck color="#004CFC" />
            {t("Accept")}
          </Button>
        </HStack>
      )}
      <AcceptDelegationModal modal={acceptDelegationModal} delegator={delegationAddress} />
      <RejectDelegationModal modal={rejectDelegationModal} delegator={delegationAddress} />
    </Stack>
  )
}
