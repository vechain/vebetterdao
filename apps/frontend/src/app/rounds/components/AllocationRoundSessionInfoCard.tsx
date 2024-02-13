import { useAllocationVotes, useAllocationsRound, useVot3PastSupply } from "@/api"
import { Card, CardBody, CardHeader, HStack, Heading, Skeleton, Text, VStack } from "@chakra-ui/react"
import { humanNumber } from "@repo/utils/FormattingUtils"

type Props = {
  roundId: string
}

export const AllocationRoundSessionInfoCard = ({ roundId }: Props) => {
  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(roundId)
  const { data: votes, isLoading: votesLoading } = useAllocationVotes(roundId)

  const { data: votesAtSnapshot, isLoading: votesAtSnapshotLoading } = useVot3PastSupply(roundInfo.voteStart)
  return (
    <Card>
      <CardHeader>
        <Heading size="md">Session Info</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4}>
          <HStack w="full" justify={"space-between"}>
            <Text fontSize="sm" fontWeight={"bold"}>
              Starting date
            </Text>
            <Skeleton isLoaded={!roundInfoLoading}>
              <Text fontSize={"sm"}>{roundInfo.voteStartTimestamp?.format("MMM D, YYYY, hh:mm A ")}</Text>
            </Skeleton>
          </HStack>
          <HStack w="full" justify={"space-between"}>
            <Text fontSize="sm" fontWeight={"bold"}>
              Ending date
            </Text>
            <Skeleton isLoaded={!roundInfoLoading}>
              <Text fontSize={"sm"}>{roundInfo.voteEndTimestamp?.format("MMM D, YYYY, hh:mm A ")}</Text>
            </Skeleton>
          </HStack>
          <HStack w="full" justify={"space-between"}>
            <Text fontSize="sm" fontWeight={"bold"}>
              Real-time votes
            </Text>
            <Skeleton isLoaded={!votesLoading}>
              <Text fontSize={"sm"}>{humanNumber(votes ?? "0", votes)}</Text>
            </Skeleton>
          </HStack>
          <HStack w="full" justify={"space-between"}>
            <Text fontSize="sm" fontWeight={"bold"}>
              Snapshot
            </Text>
            <Skeleton isLoaded={!votesAtSnapshotLoading}>
              <Text fontSize={"sm"}>{humanNumber(votesAtSnapshot ?? "0", votes)}</Text>
            </Skeleton>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
