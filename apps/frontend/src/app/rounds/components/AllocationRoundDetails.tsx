import { useAllocationAmount, useAllocationVoters, useAllocationVotes, useAllocationsRound, useXApps } from "@/api"
import { Card, CardBody, Grid, HStack, Heading, Skeleton, Stack, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"

type Props = {
  roundId: string
}
export const AllocationRoundDetails = ({ roundId }: Props) => {
  const { data, isLoading } = useAllocationsRound(roundId)
  const { data: xApps, isLoading: xAppsLoading } = useXApps()
  const { data: totalVotes, isLoading: totalVotesLoading } = useAllocationVotes(roundId)
  const { data: totalVoters, isLoading: totalVotersLoading } = useAllocationVoters(roundId)
  const { data: roundAmount, isLoading: roundAmountLoading, error: roundAmountError } = useAllocationAmount(roundId)

  const totalAmount = useMemo(() => {
    if (!roundAmount) return 0
    return BigInt(roundAmount.treasury) + BigInt(roundAmount.voteX2Earn) + BigInt(roundAmount.voteXAllocations)
  }, [roundAmount])

  return (
    <Card w="full">
      <CardBody>
        <Stack direction={["column", "row"]} justify="space-between">
          <VStack spacing={4} align="flex-start" flex={1}>
            <Skeleton isLoaded={!isLoading}>
              <HStack spacing={1} align={"center"}>
                <Heading size="md">Remaining time to vote:</Heading>
                <Text>{data?.voteEndTimestamp?.fromNow()}</Text>
              </HStack>
            </Skeleton>
            <Skeleton isLoaded={!isLoading}>
              <Heading size="xl">Allocations | Round #{data?.proposalId}</Heading>
            </Skeleton>
            <Skeleton isLoaded={!isLoading}>
              <Text color="gray.500">
                {
                  "Vote for your preferred dApps to get more B3TR distribution. This allocation process will repeat every two weeks."
                }
              </Text>
            </Skeleton>
          </VStack>
          <VStack flex={1}>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <VStack spacing={4}>
                <Skeleton isLoaded={!roundAmountLoading}>
                  {roundAmountError ? (
                    <Text color="red.500">{roundAmountError.message}</Text>
                  ) : (
                    <Heading size="md">{totalAmount.toString()}</Heading>
                  )}
                  <Text fontWeight={"thin"}>Total allocation</Text>
                </Skeleton>
              </VStack>
              <VStack spacing={4}>
                <Skeleton isLoaded={!xAppsLoading}>
                  <Heading size="md">{xApps?.length}</Heading>
                  <Text fontWeight={"thin"}>Participating dApps</Text>
                </Skeleton>
              </VStack>
              <VStack spacing={4}>
                <Skeleton isLoaded={!totalVotesLoading}>
                  <Heading size="md">{totalVotes}</Heading>
                  <Text fontWeight={"thin"}>Total votes</Text>
                </Skeleton>
              </VStack>
              <VStack spacing={4}>
                <Skeleton isLoaded={!totalVotersLoading}>
                  <Heading size="md">{totalVoters}</Heading>
                  <Text fontWeight={"thin"}>Total voters</Text>
                </Skeleton>
              </VStack>
            </Grid>
          </VStack>
        </Stack>
      </CardBody>
    </Card>
  )
}
