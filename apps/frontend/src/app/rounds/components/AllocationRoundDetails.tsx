import { useAllocationAmount, useAllocationVoters, useAllocationsRound, useHasVotedInRound, useRoundXApps } from "@/api"
import { B3TRIcon } from "@/components"
import {
  Box,
  Button,
  Card,
  CardBody,
  HStack,
  Heading,
  Skeleton,
  Stack,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"

type Props = {
  roundId: string
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
})

export const AllocationRoundDetails = ({ roundId }: Props) => {
  const { account } = useWallet()
  const { data, isLoading } = useAllocationsRound(roundId)
  const { data: xApps, isLoading: xAppsLoading } = useRoundXApps(roundId)
  const { data: totalVoters, isLoading: totalVotersLoading } = useAllocationVoters(roundId)
  const { data: roundAmount, isLoading: roundAmountLoading, error: roundAmountError } = useAllocationAmount(roundId)

  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(roundId, account ?? undefined)

  const totalAmount = useMemo(() => {
    if (!roundAmount) return 0
    return BigInt(roundAmount.treasury) + BigInt(roundAmount.voteX2Earn) + BigInt(roundAmount.voteXAllocations)
  }, [roundAmount])

  const isVotingConcluded = data?.voteEndTimestamp?.isBefore()

  const bgGradient = useColorModeValue("500", "300")

  const remainingTime = useMemo(() => {
    if (isVotingConcluded) return `Voting ended ${data?.voteEndTimestamp?.fromNow()}`
    return `Voting ends ${data?.voteEndTimestamp?.fromNow()}`
  }, [isVotingConcluded, data?.voteEndTimestamp])

  const renderVoteStatusMessage = useMemo(() => {
    if (!isVotingConcluded) {
      if (hasVoted)
        return (
          <Button as="a" href="#user-votes" colorScheme="green" fontSize={"lg"}>
            You have already voted in this round
          </Button>
        )
      return (
        <Button as="a" href="#user-votes" colorScheme="orange" fontSize={"lg"}>
          You have not voted yet in this round
        </Button>
      )
    }
    if (hasVoted)
      return (
        <Button as="a" href="#user-votes" colorScheme="green" fontSize={"lg"}>
          Voting concluded - You casted your vote successfully
        </Button>
      )
    return (
      <Button as="a" href="#user-votes" colorScheme="orange" fontSize={"lg"}>
        Voting concluded - You did not cast your vote
      </Button>
    )
  }, [hasVoted, isVotingConcluded])
  return (
    <Card w="full">
      <CardBody>
        <Stack direction={["column", "row"]} justify="space-between" spacing={[12, 12, 40]}>
          <VStack spacing={4} align="flex-start" flex={1}>
            <Skeleton isLoaded={!isLoading}>
              <HStack spacing={1} align={"center"}>
                <Heading size="md" color={isVotingConcluded ? `orange.${bgGradient}` : `primary.${bgGradient}`}>
                  {remainingTime}
                </Heading>
              </HStack>
            </Skeleton>
            <Skeleton isLoaded={!isLoading}>
              <Heading size="xl">Allocations | Round #{data?.roundId}</Heading>
            </Skeleton>
            <Skeleton isLoaded={!isLoading}>
              <Text color="gray.500">
                {
                  "Vote for your preferred dApps to get more B3TR distribution and receive rewards. This allocation process reapeats every week."
                }
              </Text>
            </Skeleton>
            <Skeleton isLoaded={!hasVotedLoading}>{renderVoteStatusMessage}</Skeleton>
          </VStack>
          <VStack flex={0.8}>
            <VStack
              color={"white"}
              bgColor={`primary.${bgGradient}`}
              py={6}
              px={6}
              w="full"
              h="full"
              borderRadius={"2xl"}
              align="flex-start"
              spacing={12}>
              <Box>
                <Skeleton isLoaded={!roundAmountLoading}>
                  {roundAmountError ? (
                    <Text color="red.500">{roundAmountError.message}</Text>
                  ) : (
                    <HStack spacing={4}>
                      <Heading size="2xl">{compactFormatter.format(Number(roundAmount?.voteX2Earn))}</Heading>
                      <B3TRIcon boxSize="40px" />
                    </HStack>
                  )}
                </Skeleton>
                <Text fontSize={"md"} textTransform={"uppercase"}>
                  Total allocation
                </Text>
              </Box>

              <HStack spacing={12}>
                <Box>
                  <Skeleton isLoaded={!xAppsLoading}>
                    <Heading size="xl">{xApps?.length}</Heading>
                  </Skeleton>
                  <Text fontSize={"md"} textTransform={"uppercase"}>
                    Participating dApps
                  </Text>
                </Box>
                <Box>
                  <Skeleton isLoaded={!totalVotersLoading}>
                    <Heading size="xl">{totalVoters}</Heading>
                  </Skeleton>
                  <Text fontSize={"md"} textTransform={"uppercase"}>
                    Total voters
                  </Text>
                </Box>
              </HStack>
            </VStack>
          </VStack>
        </Stack>
      </CardBody>
    </Card>
  )
}
