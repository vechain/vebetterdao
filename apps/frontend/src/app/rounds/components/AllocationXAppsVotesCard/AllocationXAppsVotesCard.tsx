import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Card,
  CardBody,
  CardHeader,
  Flex,
  HStack,
  Heading,
  Spinner,
  VStack,
} from "@chakra-ui/react"
import { useAllocationsRound, useRoundXApps, useXAppsVotes } from "@/api"
import { backdropBlurAnimation } from "@/app/theme"
import { AllocationXAppsVotesRankingChart } from "./AllocationXAppsVotesRankingChart"
import { useTranslation } from "react-i18next"
import { AllocationXAppsDistributionChart } from "./AllocationXAppsDistributionChart"
import { UilInfoCircle } from "@iconscout/react-unicons"

type Props = {
  roundId: string
  maxRanks?: number
}

export const AllocationXAppsVotesCard = ({ roundId, maxRanks = 8 }: Props) => {
  const { t } = useTranslation()
  const { data: xApps, isLoading: xAppsLoading } = useRoundXApps(roundId)

  const xAppsVotes = useXAppsVotes(xApps?.map(app => app.id) ?? [], roundId)

  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(roundId)

  const isVotesLoading = xAppsVotes.some(query => query.isLoading)
  const error = xAppsVotes.find(query => query.error)?.error

  const isLoading = isVotesLoading || roundInfoLoading

  const title = roundInfo.isCurrent && roundInfo.state === 0 ? t("Real time votes") : t("Votes")

  return (
    <Card flex={1} h="full" w="full" variant={"baseWithBorder"}>
      <CardHeader>
        <HStack justify={"space-between"} w="full">
          <Heading fontSize="24px" fontWeight={700}>
            {title}
          </Heading>
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={12} align={"flex-start"} w="full">
          {roundInfo.state === 1 && (
            <Alert status="error" borderRadius="16px" border={"1px solid #D23F63"} bg="#FCEEF1">
              <UilInfoCircle size={"36px"} color="#D23F63" />
              <Box>
                <AlertTitle color="#D23F63" ml={2} fontSize="14px" fontWeight={600}>
                  {t("Quorum was not reached for this round")}
                </AlertTitle>
                <AlertDescription color="#D23F63" ml={2} fontSize="14px">
                  {t("B3TR allocation will be distributed according to the votes of the previous round")}
                </AlertDescription>
              </Box>
            </Alert>
          )}
          <AllocationXAppsDistributionChart roundId={roundId} />
          <AllocationXAppsVotesRankingChart roundId={roundId} />
        </VStack>
      </CardBody>
      {(isLoading || error) && (
        <Flex
          backdropFilter="blur(10px)"
          animation={backdropBlurAnimation("0px", "10px")}
          position={"absolute"}
          h={"100%"}
          w={"100%"}
          align="center"
          justify="center"
          borderRadius={"lg"}>
          {isLoading || roundInfoLoading ? (
            <Spinner size="lg" />
          ) : error ? (
            <Alert
              w={["80%", "70%", "50%"]}
              status="error"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              height="200px"
              borderRadius={"xl"}>
              <AlertIcon boxSize="40px" mr={0} />
              <AlertTitle mt={4} mb={1} fontSize="lg">
                Error loading votes
              </AlertTitle>
              <AlertDescription maxWidth="sm">
                {error.message || "An error occurred while loading the votes"}
              </AlertDescription>
            </Alert>
          ) : null}
        </Flex>
      )}
    </Card>
  )
}
