import { Box, Button, Card, CardBody, CardHeader, Flex, HStack, Heading, Link, Text, VStack } from "@chakra-ui/react"
import { HorizontalChartBar } from "./HorizontalBarChart"
import { useAllocationsRound, useRoundXApps, useXAppsVotes } from "@/api"
import { useMemo } from "react"
import { backdropBlurAnimation } from "@/app/theme"

type Props = {
  roundId: string
}
export const AllocationXAppsVotesCard = ({ roundId }: Props) => {
  const { data: xApps } = useRoundXApps(roundId)

  const xAppsVotes = useXAppsVotes(xApps?.map(app => app.id) ?? [], roundId)

  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(roundId)

  const isConcluded = roundInfo.voteEndTimestamp?.isBefore() ?? false

  const isLoading = xAppsVotes.some(query => query.isLoading)
  const isError = xAppsVotes.some(query => query.isError)

  const isNoVotes = xAppsVotes.every(query => query.data?.votes === "0")

  const data = useMemo(
    () =>
      xAppsVotes.map(app => ({
        votes: app.data?.votes ?? "0",
        app: xApps?.find(xa => xa.id === app.data?.app)?.name ?? "",
      })),
    [xAppsVotes, xApps],
  )

  console.log({ data, xAppsVotes })

  return (
    <Card flex={1} h="full" w="full">
      <CardHeader>
        <HStack justify={"space-between"} w="full">
          <Heading size="md">Real-Time votes</Heading>
        </HStack>
      </CardHeader>
      <CardBody>
        <HorizontalChartBar data={data} xKey="app" yKey="votes" />

        <Box flex={1} />
      </CardBody>
      {isNoVotes && (
        <Flex
          backdropFilter="blur(10px)"
          animation={backdropBlurAnimation("0px", "10px")}
          position={"absolute"}
          h={"100%"}
          w={"100%"}
          align="center"
          justify="center"
          borderRadius={"lg"}>
          <Card w={["90%", "50%"]} rounded="xl" variant="outline">
            <CardBody>
              <VStack gap={4}>
                <Heading size="xl" textAlign={"center"}>
                  {isConcluded ? "No votes for this round " : "No votes yet"}
                </Heading>
                <Text textAlign={"center"} fontSize="lg" fontWeight={"thin"}>
                  {isConcluded
                    ? "The voting has concluded and noone has voted"
                    : "Noone has voted yet, be the first to vote! You're going to see real-times vote here."}
                </Text>
                {!isConcluded && (
                  <Link href="#user-votes" as={Button}>
                    Vote now
                  </Link>
                )}
              </VStack>
            </CardBody>
          </Card>
        </Flex>
      )}
    </Card>
  )
}
