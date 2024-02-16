import { useAllocationsRound, useGetVotesOnBlock } from "@/api"
import { Box, Card, CardBody, HStack, Heading, Icon, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { FaInfo, FaRecycle } from "react-icons/fa6"

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
  const totalVotes = votes.reduce((acc, vote) => acc + (isNaN(vote.value) ? 0 : vote.value), 0)
  const isCompletedAllocated = totalVotes >= 100

  const isOverDistributed = totalVotes > 100

  const getLinesColor = (index: number) => {
    if (isOverDistributed) return `orange.${index + 1}00`
    return `green.${index + 1}00`
  }
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
            <Text fontSize="sm" fontWeight="medium" color={isOverDistributed ? "orange" : "gray"}>
              {totalVotes}% distributed
            </Text>
          </HStack>
          <VStack w="full" h={24} spacing={0}>
            <HStack w="full" borderRadius={"xl"} bg="gray" h={5} spacing={0}>
              {votes
                .filter(vote => vote.value > 0)
                .map((vote, index) => (
                  <Box
                    transition={"all 0.5s linear"}
                    {...((index === 0 || totalVotes === vote.value) && { borderLeftRadius: "xl" })}
                    {...((index === votes.length - 1 || vote.value === totalVotes) &&
                      isCompletedAllocated && { borderRightRadius: "xl" })}
                    key={`${vote.id}-track`}
                    w={`${vote.value}%`}
                    bg={getLinesColor(index)}
                    h="full"
                  />
                ))}
            </HStack>
            <HStack w="full" h={"full"}>
              {votes
                .filter(vote => vote.value > 0)
                .map((vote, index) => (
                  <VStack key={`${vote.id}-line`} w={`${vote.value}%`} h={"full"} spacing={1} align="center">
                    <Box w="3px" h={"full"} bg={getLinesColor(index)} />
                    <Icon as={FaRecycle} color={getLinesColor(index)} boxSize={4} />
                    <Heading size="xs">{vote.value}%</Heading>
                  </VStack>
                ))}
            </HStack>
          </VStack>
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
