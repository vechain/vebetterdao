import { Heading, Text, Flex, VStack, Card, CardBody, HStack, Image } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useThresholdParticipationScore, useUserRoundScore } from "@/api"

export const PendingActions = () => {
  const { t } = useTranslation()
  const { data: scoreThreshold, isLoading: isScoreThresholdLoading } = useThresholdParticipationScore()
  const { data: userScore, isLoading: isUserRoundScoreLoading } = useUserRoundScore()
  if (userScore >= scoreThreshold || isUserRoundScoreLoading || isScoreThresholdLoading) return null

  return (
    <Card bg="#FFD979" borderRadius="xl" maxW="400px">
      <CardBody pb={2} position="relative" overflow="hidden" borderRadius="xl">
        <Image
          src="/images/cloud-background-orange.png"
          alt="cloud-background-orange"
          position="absolute"
          right={"-50%"}
          top={"-50%"}
        />
        <VStack align="stretch" zIndex={1} position="relative">
          <HStack align="flex-start">
            <VStack spacing={4} align="stretch" gap={0.5}>
              <Text size="xs" color="#8D6602" fontWeight="600">
                {t("PENDING ACTIONS")}
              </Text>
              <Heading fontSize="lg" fontWeight="700" color="#5F4400">
                {t("Increase your sustainable score to become eligible for voting.")}
              </Heading>
            </VStack>
            <Image src="/images/info-bell.png" alt="Pending actions" w={24} h={24} />
          </HStack>
          <Flex
            bg="white"
            justify="center"
            align="center"
            p={2}
            borderRadius="base"
            position="relative"
            overflow={"hidden"}>
            <Flex
              position="absolute"
              top={0}
              left={0}
              bottom={0}
              w={`${(userScore / scoreThreshold) * 100}%`}
              bg="#F29B32"></Flex>
            <Text fontWeight={700} fontSize={"xs"} zIndex={1}>
              {t("YOU CANNOT VOTE YET")}
            </Text>
          </Flex>
          <Flex justify="flex-end">
            <Text color="#6A6A6A" fontWeight="400" fontSize="xs">
              {t("{{userScore}}/{{scoreThreshold}} action score reached", {
                userScore: userScore ?? 0,
                scoreThreshold: scoreThreshold ?? 0,
              })}
            </Text>
          </Flex>
        </VStack>
      </CardBody>
    </Card>
  )
}
