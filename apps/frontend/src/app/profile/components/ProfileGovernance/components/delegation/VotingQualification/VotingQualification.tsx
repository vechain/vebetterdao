import { Heading, VStack, Card, HStack, Button, Text, useDisclosure } from "@chakra-ui/react"
import { UilArrowUpRight } from "@iconscout/react-unicons"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { VotingRequirementsList } from "@/app/components/CantVoteCard/VotingRequirementsList"

import { useCanUserVote } from "../../../../../../../api/contracts/governance/hooks/useCanUserVote"
import { useGetDelegatee } from "../../../../../../../api/contracts/vePassport/hooks/useGetDelegatee"
import { useGetPendingDelegationsDelegateePOV } from "../../../../../../../api/contracts/vePassport/hooks/useGetPendingDelegationsDelegateePOV"

import { DelegationModal } from "./components/DelegationModal"
import { DelegatorDelegations } from "./components/DelegatorDelegations/DelegatorDelegations"
import { PendingDelegationDelegatorPOV } from "./components/PendingDelegationDelegatorPOV/PendingDelegationDelegatorPOV"

type Props = {
  address: string
  isConnectedUser: boolean
}
export const VotingQualification = ({ address, isConnectedUser }: Props) => {
  const { t } = useTranslation()
  const { data: pendingDelegations, isLoading: isPendingDelegationsLoading } =
    useGetPendingDelegationsDelegateePOV(address)
  const { data: delegateeAddress, isLoading: isDelegateeLoading } = useGetDelegatee(address)
  const isDelegator = !isDelegateeLoading && !!delegateeAddress
  const { isPerson } = useCanUserVote(address, delegateeAddress)
  const descriptionLabel = useMemo(() => {
    return isConnectedUser
      ? t("Your are now qualified to vote. To maintain your qualification, keep using the Apps and earning B3TR tokens")
      : t(
          "The user is now qualified to vote. To maintain the qualification, the user must keep using the Apps and earning B3TR tokens",
        )
  }, [t, isConnectedUser])
  const delegationModal = useDisclosure()
  if (isPendingDelegationsLoading) return null
  return (
    <Card.Root variant="primary" rounded="xl" w="full">
      <Card.Body borderRadius="xl">
        <VStack align="stretch" gap={6}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading textStyle="xl" fontWeight="bold">
                {t(isConnectedUser ? "Your Voting Qualification" : "Voting qualification")}
              </Heading>
              {isConnectedUser && !isDelegator && Number(pendingDelegations) === 0 && (
                <Button variant={"link"} onClick={delegationModal.onOpen} size="sm">
                  <UilArrowUpRight />
                  {t("Delegate")}
                </Button>
              )}
            </HStack>
            <Text textStyle="md">
              {isConnectedUser &&
                t(
                  "To make sure you are a real person, you have to earn some of your tokens from Apps to be elegible to vote. You can also delegate your qualification to another account.",
                )}
            </Text>

            {isPerson ? descriptionLabel : <VotingRequirementsList />}
          </VStack>
          <DelegatorDelegations address={address} />
          <PendingDelegationDelegatorPOV address={address} />
        </VStack>
      </Card.Body>
      <DelegationModal modal={delegationModal} />
    </Card.Root>
  )
}
