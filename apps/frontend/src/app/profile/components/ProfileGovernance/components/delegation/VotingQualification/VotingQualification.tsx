import { useMemo } from "react"
import { Heading, VStack, Card, HStack, Button, Text, useDisclosure } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useCanUserVote, useGetDelegatee, useGetPendingDelegationsDelegateePOV } from "@/api"
import { UilArrowUpRight } from "@iconscout/react-unicons"
import { DelegationModal } from "./components/DelegationModal"
import { DelegatorDelegations } from "./components/DelegatorDelegations"
import { PendingDelegationDelegatorPOV } from "./components/PendingDelegationDelegatorPOV"
import { VotingRequirementsList } from "@/app/components/CantVoteCard/CantVoteCard"

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

  const border = isPerson ? "1px solid #D5D5D5" : "1px solid#EC9BAF"

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
    <Card.Root variant="primary" rounded="xl" w="full" border={border}>
      <Card.Body borderRadius="xl">
        <VStack align="stretch" gap={6}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading fontSize="xl" fontWeight="700">
                {t(isConnectedUser ? "Your Voting Qualification" : "Voting qualification")}
              </Heading>
              {isConnectedUser && !isDelegator && Number(pendingDelegations) === 0 && (
                <Button variant={"ghost"} color="actions.tertiary.default" onClick={delegationModal.onOpen} size="sm">
                  <UilArrowUpRight />
                  {t("Delegate")}
                </Button>
              )}
            </HStack>
            <Text fontSize="md">
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
