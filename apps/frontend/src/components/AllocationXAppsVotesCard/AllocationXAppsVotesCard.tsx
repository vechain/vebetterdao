import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  HStack,
  Heading,
  Link,
  Spinner,
} from "@chakra-ui/react"
import { useAllocationsRound, useRoundXApps, useXAppsVotes } from "@/api"
import { backdropBlurAnimation } from "@/app/theme"
import { AllocationXAppsVotesRankingChart } from "./AllocationXAppsVotesRankingChart"

type Props = {
  roundId: string
}

const maxRanks = 3
export const AllocationXAppsVotesCard = ({ roundId }: Props) => {
  const { data: xApps } = useRoundXApps(roundId)

  const xAppsVotes = useXAppsVotes(xApps?.map(app => app.id) ?? [], roundId)

  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(roundId)

  const isConcluded = roundInfo.voteEndTimestamp?.isBefore() ?? false

  const isVotesLoading = xAppsVotes.some(query => query.isLoading)
  const error = xAppsVotes.find(query => query.error)?.error

  const isNoVotes = xAppsVotes.every(query => query.data?.votes === "0")

  const isLoading = isVotesLoading || roundInfoLoading

  const isMoreThanMaxRanks = xAppsVotes.length > maxRanks

  return (
    <Card flex={1} h="full" w="full">
      <CardHeader>
        <HStack justify={"space-between"} w="full">
          <Heading size="md">Real-Time votes</Heading>
        </HStack>
      </CardHeader>
      <CardBody>
        <AllocationXAppsVotesRankingChart roundId={roundId} maxRanks={maxRanks} />

        <Box flex={1} />
      </CardBody>
      {(isNoVotes || isLoading || error) && (
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
          ) : !!error ? (
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
          ) : (
            <Alert
              w={["80%", "70%", "50%"]}
              status="info"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              borderRadius={"xl"}>
              <AlertIcon boxSize="40px      " mr={0} />
              <AlertTitle mt={4} mb={1} fontSize="lg">
                {isConcluded ? "No votes for this round " : "No votes yet"}
              </AlertTitle>
              <AlertDescription maxWidth="sm">
                {isConcluded
                  ? "The voting has concluded and noone has voted"
                  : "Noone has voted yet, be the first to vote! You're going to see real-times vote here."}
              </AlertDescription>
              {!isConcluded && (
                <Button as={Link} href="#user-votes" mt={4}>
                  Vote now
                </Button>
              )}
            </Alert>
          )}
        </Flex>
      )}
      <CardFooter>
        {/* TODO: Implement this */}
        {isMoreThanMaxRanks && (
          <Button variant={"link"} colorScheme="primary" size="lg">
            View all
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
