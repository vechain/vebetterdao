import { useAllocationsRound } from "@/api"
import { Card, CardBody, HStack, Heading, Skeleton, Stack, Text, VStack } from "@chakra-ui/react"

type Props = {
  roundId: string
}
export const AllocationRoundDetails = ({ roundId }: Props) => {
  const { data, isLoading } = useAllocationsRound(roundId)

  return (
    <Card>
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
          <VStack flex={1}></VStack>
        </Stack>
      </CardBody>
    </Card>
  )
}
