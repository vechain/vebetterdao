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
import { useThresholdParticipationScore, useUserCurrentRoundScore } from "@/api"
import { useMemo } from "react"
import { UilArrowUpRight, UilCheck, UilTimes } from "@iconscout/react-unicons"
import { AddressIcon } from "@/components/AddressIcon"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { DelegationModal } from "./components/DelegationModal"

export const VotingQualification = () => {
  const { t } = useTranslation()
  // TODO: fill with real data
  const isDelegated = false
  const delegateeAddress = "0x1234567890123456789012345678901234567890"
  const delegationDate = "2024-01-01"

  const { data: scoreThreshold, isLoading: isScoreThresholdLoading } = useThresholdParticipationScore()
  const { data: userScore, isLoading: isUserRoundScoreLoading } = useUserCurrentRoundScore()

  const scorePercentage = useMemo(
    () => (Number(scoreThreshold) ? Math.min((Number(userScore || 0) / Number(scoreThreshold || 0)) * 100, 100) : 100),
    [userScore, scoreThreshold],
  )
  const qualificationReached = userScore >= scoreThreshold
  const border = qualificationReached ? "1px solid #D5D5D5" : "1px solid#EC9BAF"
  const progressLabel = useMemo(() => {
    if (scorePercentage === 100) return t("QUALIFIED TO VOTE")
    return t("{{scorePercentage}}% QUALIFIED TO VOTE", { scorePercentage })
  }, [scorePercentage, t])

  const descriptionLabel = useMemo(() => {
    if (scorePercentage === 100)
      return t(
        "Your are now qualified to vote. To maintain your qualification, keep using the Apps and earning B3TR tokens",
      )
    return t("To be availabe to vote on the platform, you must do more Better Actions on the Apps")
  }, [scorePercentage, t])

  const darkColor = useMemo(() => {
    if (scorePercentage === 100) return "#3DBA67"
    return "#C84968"
  }, [scorePercentage])

  const lightColor = "#FCEEF1"

  const delegationModal = useDisclosure()

  if (isUserRoundScoreLoading || isScoreThresholdLoading) return null

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
                {!isDelegated && qualificationReached && (
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
          {isDelegated && (
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
                      <Text fontSize={["2xs", "2xs", "xs"]} color="#6A6A6A">
                        {t("Delegating since {{date}}", { date: delegationDate })}
                      </Text>
                    </VStack>
                  </HStack>
                  <HStack>
                    <Button variant={"dangerGhost"} p={3} leftIcon={<UilTimes color="#C84968" />}>
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
    </Card>
  )
}
