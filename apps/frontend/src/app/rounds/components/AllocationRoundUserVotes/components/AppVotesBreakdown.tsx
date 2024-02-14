import { useAllocationsRound, useGetVotesOnBlock } from "@/api"
import { Box, Card, CardBody, HStack, Heading, Icon, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { FaInfo } from "react-icons/fa6"

type Props = {
  roundId: string
  votes: {
    id: string
    value: number
  }[]
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
})
export const AppVotesBreakdown = ({ roundId, votes }: Props) => {
  const { account } = useWallet()
  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(roundId)
  const { data: votesAtSnapshot, isLoading: votesAtSnapshotLoading } = useGetVotesOnBlock(
    Number(roundInfo.voteStart),
    account ?? undefined,
  )
  console.log("votes", votes)
  const totalVotes = votes.reduce((acc, vote) => acc + vote.value, 0)
  const isCompletedAllocated = totalVotes >= 100
  return (
    <Card variant="outline" w="full">
      <CardBody>
        <VStack w="full" spacing={8}>
          <HStack justify={"space-between"} align="flex-end" w="full">
            <Box>
              <Skeleton isLoaded={!roundInfoLoading && !votesAtSnapshotLoading}>
                <Heading size="2xl">{compactFormatter.format(Number(votesAtSnapshot?.scaled) ?? 0)}</Heading>
              </Skeleton>
              <Text fontSize={"md"} textTransform={"uppercase"}>
                Your Voting Power
              </Text>
            </Box>
            <Text fontSize="sm" color="gray.500">
              {totalVotes}% distributed
            </Text>
          </HStack>
          <HStack w="full" borderRadius={"xl"} bg="gray" h={5} spacing={0}>
            {votes.map((vote, index) => (
              <HStack
                {...(index === 0 && { borderLeftRadius: "xl" })}
                {...((index === votes.length - 1 || vote.value === 100) &&
                  isCompletedAllocated && { borderRightRadius: "xl" })}
                key={vote.id}
                w={`${vote.value}%`}
                bg={`green.${index + 1}00`}
                justify="space-between"
                h="full"></HStack>
            ))}
          </HStack>
          <HStack w="full" spacing={4}>
            <Icon as={FaInfo} color="gray.500" />
            <Text fontSize="sm" color="gray.500">
              This amount was snapshoted at the moment the proposal was created. If you got more VOT3 after that, you
              will use it on the nexts proposals. Know more
            </Text>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
