import { useMemo } from "react"
import { Heading, VStack, Card, CardBody, HStack, Button, Text, Flex, useDisclosure } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useGetDelegatee, useGetPendingDelegationsDelegateePOV } from "@/api"
import { UilArrowUpRight, UilCheck } from "@iconscout/react-unicons"
import { DelegationModal } from "./components/DelegationModal"
import { DelegatorDelegations } from "./components/DelegatorDelegations"
import { PendingDelegationDelegatorPOV } from "./components/PendingDelegationDelegatorPOV"
import { useVotingStatusMessages } from "@/hooks"

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

  const { qualificationMessages, scorePercentage, isLoading, isPersonAtSnapshot } = useVotingStatusMessages({
    address,
    isConnectedUser,
  })

  const border = isPersonAtSnapshot ? "1px solid #D5D5D5" : "1px solid#EC9BAF"
  const darkColor = useMemo(() => {
    if (isPersonAtSnapshot) return "#3DBA67"
    return "#C84968"
  }, [isPersonAtSnapshot])

  const lightColor = "#FCEEF1"

  const delegationModal = useDisclosure()
  if (isLoading || isPendingDelegationsLoading || !qualificationMessages) return null

  return (
    <Card borderRadius="xl" w="full" border={border}>
      <CardBody borderRadius="xl">
        <VStack align="stretch" gap={10}>
          <VStack align="stretch" gap={6}>
            <VStack align="stretch">
              <HStack justify="space-between">
                <Heading fontSize="xl" fontWeight="700">
                  {t(isConnectedUser ? "Your Voting Qualification" : "Voting qualification")}
                </Heading>
                {isConnectedUser && !isDelegator && Number(pendingDelegations) === 0 && (
                  <Button
                    variant={"primaryGhost"}
                    onClick={delegationModal.onOpen}
                    leftIcon={<UilArrowUpRight />}
                    size="sm">
                    {t("Delegate")}
                  </Button>
                )}
              </HStack>
              <Text color="#6A6A6A" fontSize="md">
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
                <Text fontWeight={700} fontSize={"xs"} zIndex={1} color={scorePercentage > 60 ? "white" : "black"}>
                  {qualificationMessages?.labelStatus}
                </Text>
              </Flex>
              <HStack gap={1}>
                <UilCheck color={darkColor} />
                <Text fontSize="xs" color={darkColor}>
                  {qualificationMessages?.descriptionLabel}
                </Text>
              </HStack>
            </VStack>
          </VStack>
          <DelegatorDelegations address={address} />
          <PendingDelegationDelegatorPOV address={address} />
        </VStack>
      </CardBody>
      <DelegationModal modal={delegationModal} />
    </Card>
  )
}
