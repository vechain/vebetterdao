import {
  useAllocationAmount,
  useAllocationBaseAmount,
  useAllocationSharesCap,
  useAllocationsRound,
  useHasVotedInRound,
  useRoundXApps,
} from "@/api"
import { B3TRIcon } from "@/components"
import {
  Box,
  Button,
  Card,
  CardBody,
  Grid,
  HStack,
  Heading,
  Skeleton,
  Stack,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"

const compactFormatter = getCompactFormatter()
type Props = {
  roundId: string
}

export const AllocationRoundDetails = ({ roundId }: Props) => {
  const { account } = useWallet()
  const { data, isLoading } = useAllocationsRound(roundId)

  const { data: roundAmount, isLoading: roundAmountLoading, error: roundAmountError } = useAllocationAmount(roundId)
  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(roundId, account ?? undefined)
  const { data: baseAmount, isLoading: baseAmountLoading, error: baseAmountError } = useAllocationBaseAmount(roundId)
  const { data: appSharesCap } = useAllocationSharesCap(roundId)
  const { data: xApps } = useRoundXApps(roundId)

  const isVotingConcluded = data?.voteEndTimestamp?.isBefore()

  const bgGradient = useColorModeValue("500", "300")

  const remainingTime = useMemo(() => {
    if (isVotingConcluded) return `Voting ended ${data?.voteEndTimestamp?.fromNow()}`
    return `Voting ends ${data?.voteEndTimestamp?.fromNow()}`
  }, [isVotingConcluded, data?.voteEndTimestamp])

  const maxDAppAllocation = useMemo(() => {
    if (!roundAmount || !appSharesCap || !baseAmount || !xApps) return 0

    // it's the base allocation plus the shares of the voters
    const remainingAllocation = parseInt(roundAmount.voteXAllocations) - parseInt(baseAmount) * xApps.length

    const maxVariableAllocation = Math.round(remainingAllocation * (parseInt(appSharesCap) / 100))

    return maxVariableAllocation + parseInt(baseAmount)
  }, [baseAmount, roundAmount, appSharesCap, xApps])

  const renderVoteStatusMessage = useMemo(() => {
    if (!isVotingConcluded) {
      if (hasVoted)
        return (
          <VStack spacing={1} align="flex-start" flex={1}>
            <Button as="a" href="#user-votes" colorScheme="primary" size={["md"]}>
              Round is active
            </Button>
            <Text fontSize={"md"} color={`primary.${bgGradient}`} fontWeight={600}>
              You have voted successfully!
            </Text>
          </VStack>
        )
      return (
        <VStack spacing={1} align="flex-start" flex={1}>
          <Button as="a" href="#user-votes" colorScheme="primary" size={["md"]}>
            Round is active
          </Button>
          <Text fontSize={"md"} color={`primary.${bgGradient}`} fontWeight={600}>
            You have not cast your vote yet.
          </Text>
        </VStack>
      )
    }
    if (hasVoted)
      return (
        <VStack spacing={1} align="flex-start" flex={1}>
          <Button as="a" href="#user-votes" colorScheme="green" size={["md"]}>
            Voting concluded
          </Button>
          <Text fontSize={"md"} color="green" fontWeight={600}>
            Your vote has been cast successfully!
          </Text>
        </VStack>
      )
    return (
      <VStack spacing={1} align="flex-start" flex={1}>
        <Button as="a" href="#user-votes" colorScheme="orange" size={["md"]}>
          Voting concluded
        </Button>
        <Text fontSize={"md"} color={`orange.${bgGradient}`} fontWeight={600}>
          You did not cast your vote.
        </Text>
      </VStack>
    )
  }, [hasVoted, isVotingConcluded])
  return (
    <Card w="full" borderRadius={"3xl"}>
      <CardBody>
        <Stack direction={["column", "row"]} justify="space-between" spacing={[12, 12, 40]}>
          <VStack spacing={4} align="flex-start" flex={1}>
            <Skeleton isLoaded={!isLoading}>
              <HStack spacing={1} align={"center"}>
                <Heading
                  size={["sm", "md"]}
                  color={isVotingConcluded ? `orange.${bgGradient}` : `primary.${bgGradient}`}>
                  {remainingTime}
                </Heading>
              </HStack>
            </Skeleton>
            <Skeleton isLoaded={!isLoading}>
              <Heading size={["lg", "xl"]}>Allocations | Round #{data?.roundId}</Heading>
            </Skeleton>
            <Skeleton isLoaded={!isLoading}>
              <Text color="gray.500" fontSize={["sm", "md"]}>
                {
                  "Vote for your preferred app to determine funding from the Apps allocation budget. More votes mean more funding. Plus, earn rewards from the Voting Rewards allocation by voting in this round. This allocation process repeats every week."
                }
              </Text>
            </Skeleton>
            {!!account && (
              <Skeleton isLoaded={!hasVotedLoading} mt={2}>
                {renderVoteStatusMessage}
              </Skeleton>
            )}
          </VStack>
          <VStack flex={0.8}>
            <VStack
              color={"white"}
              bgColor={`primary.${bgGradient}`}
              py={6}
              px={6}
              w="full"
              h="fit-content"
              borderRadius={"2xl"}
              align="flex-start"
              spacing={12}>
              <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
                <Box>
                  <Skeleton isLoaded={!roundAmountLoading}>
                    {roundAmountError ? (
                      <Text color="red.500">{roundAmountError.message}</Text>
                    ) : (
                      <HStack spacing={2}>
                        <Heading size="2xl">{compactFormatter.format(Number(roundAmount?.voteX2Earn))}</Heading>
                        <B3TRIcon boxSize="40px" colorVariant="dark" />
                      </HStack>
                    )}
                  </Skeleton>
                  <Text fontSize={"md"} textTransform={"uppercase"}>
                    Apps allocation
                  </Text>
                </Box>
                <Box>
                  <Skeleton isLoaded={!roundAmountLoading}>
                    {roundAmountError ? (
                      <Text color="red.500">{roundAmountError.message}</Text>
                    ) : (
                      <HStack spacing={2}>
                        <Heading size="2xl">{compactFormatter.format(Number(roundAmount?.voteXAllocations))}</Heading>
                        <B3TRIcon boxSize="40px" colorVariant="dark" />
                      </HStack>
                    )}
                  </Skeleton>
                  <Text fontSize={"md"} textTransform={"uppercase"}>
                    Voting rewards
                  </Text>
                </Box>
              </Grid>
              <Grid templateColumns={["repeat(2, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
                <Box>
                  <Skeleton isLoaded={!baseAmountLoading}>
                    {baseAmountError ? (
                      <Text color="red.500">{baseAmountError.message}</Text>
                    ) : (
                      <HStack spacing={2}>
                        <Heading size="xl">{compactFormatter.format(Number(baseAmount))}</Heading>
                        <B3TRIcon boxSize="30px" colorVariant="dark" />
                      </HStack>
                    )}
                  </Skeleton>
                  <Text fontSize={"md"} textTransform={"uppercase"}>
                    Min allocation
                  </Text>
                </Box>
                <Box>
                  <Skeleton isLoaded={!baseAmountLoading}>
                    {baseAmountError ? (
                      <Text color="red.500">{baseAmountError.message}</Text>
                    ) : (
                      <HStack spacing={2}>
                        <Heading size="xl">{compactFormatter.format(Number(maxDAppAllocation))}</Heading>
                        <B3TRIcon boxSize="30px" colorVariant="dark" />
                      </HStack>
                    )}
                  </Skeleton>
                  <Text fontSize={"md"} textTransform={"uppercase"}>
                    Max allocation
                  </Text>
                </Box>
              </Grid>
            </VStack>
          </VStack>
        </Stack>
      </CardBody>
    </Card>
  )
}
