import { Alert, Card, Flex, HStack, Heading, Spinner, VStack } from "@chakra-ui/react"
import { useAllocationsRound, useRoundXApps, useXAppsShares } from "@/api"
import { AllocationXAppsVotesRankingChart } from "./AllocationXAppsVotesRankingChart"
import { useTranslation } from "react-i18next"
import { AllocationXAppsDistributionChart } from "./AllocationXAppsDistributionChart"
import { UilInfoCircle } from "@iconscout/react-unicons"

type Props = {
  roundId: string
}

export const AllocationXAppsVotesCard = ({ roundId }: Props) => {
  const { t } = useTranslation()
  const { data: xApps } = useRoundXApps(roundId)

  const xAppsSharesQuery = useXAppsShares(xApps?.map(app => app.id) ?? [], roundId)

  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(roundId)

  const error = xAppsSharesQuery.error

  const isLoading = xAppsSharesQuery.isLoading || roundInfoLoading

  const title = roundInfo.isCurrent && roundInfo.state === 0 ? t("Real time votes") : t("Votes")

  const renderContent = () => {
    if (isLoading) {
      return <Spinner size="lg" />
    }

    if (error) {
      return (
        <Alert.Root
          w={["80%", "70%", "50%"]}
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius={"xl"}>
          <Alert.Indicator boxSize="40px" mr={0} />
          <Alert.Title mt={4} mb={1} textStyle="lg">
            {t("Error loading votes")}
          </Alert.Title>
          <Alert.Description maxWidth="sm">
            {error.message || "An error occurred while loading the votes"}
          </Alert.Description>
        </Alert.Root>
      )
    }

    return null
  }

  return (
    <Card.Root flex={1} h="full" w="full" variant="primary">
      <Card.Header>
        <HStack justify={"space-between"} w="full">
          <Heading size="2xl">{title}</Heading>
        </HStack>
      </Card.Header>
      <Card.Body>
        <VStack gap={12} align={"flex-start"} w="full">
          {roundInfo.state === 1 && (
            <Alert.Root status="error" borderRadius="16px" border={"1px solid #D23F63"} bg="#FCEEF1">
              <Alert.Indicator>
                <UilInfoCircle size={"36px"} color="#D23F63" />
              </Alert.Indicator>
              <Alert.Content>
                <Alert.Title
                  color="#D23F63"
                  ml={2}
                  fontSize="14px"
                  fontWeight="semibold"
                  data-testid={"round-error-msg"}>
                  {t("Quorum was not reached for this round")}
                </Alert.Title>
                <Alert.Description color="#D23F63" ml={2} fontSize="14px">
                  {t("B3TR allocation will be distributed according to the votes of the previous round")}
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}
          <AllocationXAppsDistributionChart roundId={roundId} />
          <AllocationXAppsVotesRankingChart roundId={roundId} />
        </VStack>
      </Card.Body>
      {(isLoading || error) && (
        <Flex
          backdropFilter="blur(10px)"
          animation="backdropBlur"
          position={"absolute"}
          h={"100%"}
          w={"100%"}
          align="center"
          justify="center"
          borderRadius={"lg"}>
          {renderContent()}
        </Flex>
      )}
    </Card.Root>
  )
}
