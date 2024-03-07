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
  Icon,
  Skeleton,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useAllocationVoters, useAllocationsRound, useRoundXApps, useXAppsVotes } from "@/api"
import { backdropBlurAnimation } from "@/app/theme"
import { AllocationXAppsVotesRankingChart } from "./AllocationXAppsVotesRankingChart"
import { FaArrowRight } from "react-icons/fa6"

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
})

type Props = {
  roundId: string
}

const maxRanks = 3
export const AllocationXAppsVotesCard = ({ roundId }: Props) => {
  const { data: xApps, isLoading: xAppsLoading } = useRoundXApps(roundId)

  const xAppsVotes = useXAppsVotes(xApps?.map(app => app.id) ?? [], roundId)
  const { data: voters, isLoading: votersLoading } = useAllocationVoters(roundId)

  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(roundId)

  const isVotesLoading = xAppsVotes.some(query => query.isLoading)
  const error = xAppsVotes.find(query => query.error)?.error

  const isLoading = isVotesLoading || roundInfoLoading

  const isMoreThanMaxRanks = xAppsVotes.length > maxRanks

  return (
    <Card flex={1} h="full" w="full">
      <CardHeader>
        <HStack justify={"space-between"} w="full">
          <Heading size="md">{roundInfo.isCurrent ? "Real-Time data" : "Votes"}</Heading>
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={8} align={"flex-start"} w="full">
          {roundInfo.state === "1" && (
            <Alert status="error" borderRadius={"2xl"}>
              <AlertIcon />
              <Box>
                <AlertTitle>Quorum was not reached for this round</AlertTitle>
                <AlertDescription>
                  B3TR allocation will be distributed according to the votes of the previous round
                </AlertDescription>
              </Box>
            </Alert>
          )}
          <AllocationXAppsVotesRankingChart roundId={roundId} maxRanks={maxRanks} />
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
      <CardFooter>
        <Stack
          direction={["column", "row"]}
          spacing={8}
          justify={"space-between"}
          w="full"
          align={["flex-start", "center"]}>
          <Stack
            direction={["column", "row"]}
            spacing={[8, 20]}
            align={["flex-start", "center"]}
            justify={"flex-start"}
            w="full">
            <VStack align={["flex-start"]} spacing={0}>
              <Skeleton isLoaded={!xAppsLoading}>
                <Heading size={["xl"]} color={"primary.500"}>
                  {xApps?.length}
                </Heading>
              </Skeleton>
              <Text fontSize="lg" fontWeight={400}>
                dApps
              </Text>
            </VStack>
            <VStack align={["flex-start"]} spacing={0}>
              <Skeleton isLoaded={!votersLoading}>
                <Heading size={["xl"]} color={"primary.500"}>
                  {compactFormatter.format(Number(voters))}
                </Heading>
              </Skeleton>
              <Text fontSize="lg" fontWeight={400}>
                Voters
              </Text>
            </VStack>
          </Stack>
          {/* TODO: Implement this */}
          {isMoreThanMaxRanks && (
            <Button
              variant={"link"}
              colorScheme="primary"
              size="lg"
              rightIcon={
                <Icon
                  as={FaArrowRight}
                  style={{
                    transition: "all 0.2s ease-in-out",
                    transform: "rotate(-45deg)",
                  }}
                />
              }>
              View all
            </Button>
          )}
        </Stack>
      </CardFooter>
    </Card>
  )
}
