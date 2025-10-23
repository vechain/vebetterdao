import { Stack, HStack, VStack, Text, Button, useDisclosure } from "@chakra-ui/react"
import { UilCheck, UilTimes } from "@iconscout/react-unicons"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import { AddressIcon } from "@/components/AddressIcon"

import { useCanUserVote } from "../../../../../../../../api/contracts/governance/hooks/useCanUserVote"
import { QualificationBadge } from "../../QualificationBadges"

import { AcceptDelegationModal } from "./AcceptDelegationModal"
import { RejectDelegationModal } from "./RejectDelegationModal"

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
            <Text fontWeight="semibold" textStyle={["sm", "sm", "lg"]}>
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
          <Button colorPalette="red" variant={"ghost"} p={3} onClick={rejectDelegationModal.onOpen}>
            <UilTimes color="status.negative.primary" />
            {t("Reject")}
          </Button>
          <Button variant="ghost" color="actions.tertiary.default" p={3} onClick={acceptDelegationModal.onOpen}>
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
