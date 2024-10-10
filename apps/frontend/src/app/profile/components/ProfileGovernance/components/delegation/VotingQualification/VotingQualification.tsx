import {
  Heading,
  VStack,
  Card,
  CardBody,
  HStack,
  Button,
  Text,
  Flex,
  Divider,
  Stack,
  useDisclosure,
} from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useGetUserDelegatee, useUserScore } from "@/api"
import { useMemo } from "react"
import { UilArrowUpRight, UilCheck, UilTimes } from "@iconscout/react-unicons"
import { AddressIcon } from "@/components/AddressIcon"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { DelegationModal } from "./components/DelegationModal"
import { RevokeDelegationDelegatorPOVModal } from "./components/RevokeDelegationDelegatorPOVModal"
import { useGetUserPendingDelegationsDelegatorPOV } from "@/api/contracts/vePassport/hooks/useGetPendingDelegationsDelegatorPOV"

export const VotingQualification = () => {
  const { t } = useTranslation()
  const { data: delegateeAddress, isLoading: isDelegateeLoading } = useGetUserDelegatee()
  const isDelegator = !isDelegateeLoading && !!Number(delegateeAddress)

  const { data: pendingDelegations, isLoading: isPendingDelegationsLoading } =
    useGetUserPendingDelegationsDelegatorPOV()

  const { isUserQualified, scorePercentage, isLoading: isScoreLoading } = useUserScore()

  const border = isUserQualified ? "1px solid #D5D5D5" : "1px solid#EC9BAF"
  const progressLabel = useMemo(() => {
    if (isUserQualified) return t("QUALIFIED TO VOTE")
    return t("{{scorePercentage}}% QUALIFIED TO VOTE", { scorePercentage })
  }, [isUserQualified, scorePercentage, t])

  const descriptionLabel = useMemo(() => {
    if (isUserQualified)
      return t(
        "Your are now qualified to vote. To maintain your qualification, keep using the Apps and earning B3TR tokens",
      )
    return t("To be availabe to vote on the platform, you must do more Better Actions on the Apps")
  }, [isUserQualified, t])

  const darkColor = useMemo(() => {
    if (isUserQualified) return "#3DBA67"
    return "#C84968"
  }, [isUserQualified])

  const lightColor = "#FCEEF1"

  const delegationModal = useDisclosure()
  const revokeDelegationModal = useDisclosure()

  if (isScoreLoading || isPendingDelegationsLoading) return null

  return (
    <Card borderRadius="xl" w="full" border={border}>
      <CardBody borderRadius="xl">
        <VStack align="stretch" gap={10}>
          <VStack align="stretch" gap={6}>
            <VStack align="stretch">
              <HStack justify="space-between">
                <Heading fontSize="xl" fontWeight="700">
                  {t("Your Voting Qualification")}
                </Heading>
                {!isDelegator && isUserQualified && pendingDelegations?.length === 0 && (
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
                {t(
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
                  {progressLabel}
                </Text>
              </Flex>
              <HStack gap={1}>
                <UilCheck color={darkColor} />
                <Text fontSize="xs" color={darkColor}>
                  {descriptionLabel}
                </Text>
              </HStack>
            </VStack>
          </VStack>
          {isDelegator && (
            <>
              <Divider />
              <VStack align="stretch" gap={6}>
                <VStack align="stretch">
                  <HStack justify="space-between">
                    <Heading fontSize="xl" fontWeight="700">
                      {t("You’ve delegated your qualification")}
                    </Heading>
                  </HStack>
                  <Text color="#6A6A6A" fontSize="md">
                    {t("You are not currently able to vote due other user is using your Voting Qualification.")}
                  </Text>
                </VStack>
                <Stack
                  direction={["column", "column", "row"]}
                  justify={"space-between"}
                  bg="#F8F8F8"
                  rounded="xl"
                  p={3}
                  gap={[2, 2, 6]}>
                  <HStack gap={4}>
                    <AddressIcon address={delegateeAddress} w={12} h={12} rounded="full" />
                    <VStack align="start" gap={0}>
                      <Text fontWeight="600" fontSize={["sm", "sm", "lg"]}>
                        {humanAddress(delegateeAddress, 4, 4)}
                      </Text>
                    </VStack>
                  </HStack>
                  <HStack>
                    <Button
                      variant={"dangerGhost"}
                      p={3}
                      leftIcon={<UilTimes color="#C84968" />}
                      onClick={revokeDelegationModal.onOpen}>
                      {t("Remove delegation")}
                    </Button>
                  </HStack>
                </Stack>
              </VStack>
            </>
          )}
        </VStack>
      </CardBody>
      <DelegationModal modal={delegationModal} />
      <RevokeDelegationDelegatorPOVModal modal={revokeDelegationModal} delegatee={delegateeAddress} />
    </Card>
  )
}
