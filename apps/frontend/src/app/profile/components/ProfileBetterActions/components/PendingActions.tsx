import { useCurrentSustainabilityOverview } from "@/api"
import { Heading, Text, Flex, VStack, Card, CardBody, HStack, Image } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const PendingActions = () => {
  const { t } = useTranslation()
  const { data: userOverview, isLoading: isUserOverviewLoading } = useCurrentSustainabilityOverview()
  const actionsPerformed = userOverview?.actionsRewarded ?? 0
  // TODO: get this from the backend
  const totalActions = 10
  if (actionsPerformed >= totalActions || isUserOverviewLoading) return null
  const actionsNeeded = totalActions - actionsPerformed
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
                {t("You need {{actionsNeeded}} more actions to become able to vote on this round.", { actionsNeeded })}
              </Heading>
            </VStack>
            <Image src="/images/robot-alert.png" alt="Pending actions" w={24} h={24} />
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
              w={`${(actionsPerformed / totalActions) * 100}%`}
              bg="#F29B32"></Flex>
            <Text fontWeight={700} fontSize={"xs"} zIndex={1}>
              {t("YOU CANNOT VOTE YET")}
            </Text>
          </Flex>
          <Flex justify="flex-end">
            <Text color="#6A6A6A" fontWeight="400" fontSize="xs">
              {t("{{actionsPerformed}}/{{totalActions}} actions performed", { actionsPerformed, totalActions })}
            </Text>
          </Flex>
        </VStack>
      </CardBody>
    </Card>
  )
}
