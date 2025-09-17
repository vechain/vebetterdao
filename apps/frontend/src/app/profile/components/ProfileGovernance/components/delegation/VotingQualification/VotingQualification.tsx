import { useMemo } from "react"
import { Heading, VStack, Card, HStack, Button, Text, Flex, useDisclosure, Icon } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useCanUserVote, useGetDelegatee, useGetPendingDelegationsDelegateePOV, useUserScore } from "@/api"
import { UilArrowUpRight, UilCheck } from "@iconscout/react-unicons"
import { DelegationModal } from "./components/DelegationModal"
import { DelegatorDelegations } from "./components/DelegatorDelegations"
import { PendingDelegationDelegatorPOV } from "./components/PendingDelegationDelegatorPOV"
import { useMissingActionsLabel } from "@/hooks"

type Props = {
  address: string
  isConnectedUser: boolean
}

export const VotingQualification = ({ address, isConnectedUser }: Props) => {
  const { t } = useTranslation()

  const { data: pendingDelegations, isLoading: isPendingDelegationsLoading } =
    useGetPendingDelegationsDelegateePOV(address)

  const { missingActions, isUserDelegatee, scorePercentage, isLoading: isScoreLoading } = useUserScore(address)

  const { data: delegateeAddress, isLoading: isDelegateeLoading } = useGetDelegatee(address)
  const isDelegator = !isDelegateeLoading && !!delegateeAddress
  const { isPerson } = useCanUserVote(address, delegateeAddress)

  const missingActionsLabel = useMissingActionsLabel({ missingActions, isUserDelegatee })

  const border = isPerson ? "1px solid #D5D5D5" : "1px solid #EC9BAF"
  const progressLabel = useMemo(() => {
    if (isPerson) return t("QUALIFIED TO VOTE")
    return missingActionsLabel.short
  }, [isPerson, missingActionsLabel.short, t])

  const descriptionLabel = useMemo(() => {
    if (isPerson)
      return isConnectedUser
        ? t(
            "Your are now qualified to vote. To maintain your qualification, keep using the Apps and earning B3TR tokens",
          )
        : t(
            "The user is now qualified to vote. To maintain the qualification, the user must keep using the Apps and earning B3TR tokens",
          )
    return isConnectedUser
      ? t("To be availabe to vote on the platform, you must do more Better Actions on the Apps")
      : t("To be availabe to vote on the platform, the user must do more Better Actions on the Apps")
  }, [isPerson, t, isConnectedUser])

  const darkColor = useMemo(() => {
    if (isPerson) return "status.primary.default"
    return "#C84968"
  }, [isPerson])

  const lightColor = "status.positive.primary"

  const delegationModal = useDisclosure()

  if (isScoreLoading || isPendingDelegationsLoading) return null

  return (
    <Card.Root variant="primary" rounded="xl" w="full" border={border}>
      <Card.Body borderRadius="xl">
        <VStack align="stretch" gap={10}>
          <VStack align="stretch" gap={6}>
            <VStack align="stretch">
              <HStack justify="space-between">
                <Heading textStyle="xl">
                  {t(isConnectedUser ? "Your Voting Qualification" : "Voting qualification")}
                </Heading>
                {isConnectedUser && !isDelegator && Number(pendingDelegations) === 0 && (
                  <Button variant="secondary" onClick={delegationModal.onOpen} size="sm">
                    <Icon as={UilArrowUpRight} boxSize={4} color="actions.tertiary.default" />
                    {t("Delegate")}
                  </Button>
                )}
              </HStack>
              <Text color="text.subtle" textStyle="md">
                {isConnectedUser &&
                  t(
                    "To make sure you are a real person, you have to earn some of your tokens from Apps to be elegible to vote. You can also delegate your qualification to another account.",
                  )}
              </Text>
            </VStack>
            <VStack align="stretch">
              <Flex bg={lightColor} justify="center" align="center" p={2} rounded="full" position="relative">
                <Flex
                  position="absolute"
                  top={0}
                  left={0}
                  bottom={0}
                  w={`${scorePercentage}%`}
                  bg={darkColor}
                  rounded="full"></Flex>
                <Text textStyle={"xs"} zIndex={1} color={scorePercentage > 60 ? "white" : "black"}>
                  {progressLabel}
                </Text>
              </Flex>
              <HStack gap={1}>
                <Icon as={UilCheck} boxSize={4} color={darkColor} />
                <Text textStyle="xs" color={darkColor}>
                  {descriptionLabel}
                </Text>
              </HStack>
            </VStack>
          </VStack>
          <DelegatorDelegations address={address} />
          <PendingDelegationDelegatorPOV address={address} />
        </VStack>
      </Card.Body>
      <DelegationModal modal={delegationModal} />
    </Card.Root>
  )
}
