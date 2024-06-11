import {
  useAllocationAmount,
  useAllocationBaseAmount,
  useAllocationsRound,
  useHasVotedInRound,
  useMaxAllocationAmount,
  useRoundXApps,
  useUserVotesInRound,
} from "@/api"
import { AllocationStateBadge, B3TRIcon } from "@/components"
import {
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Grid,
  HStack,
  Heading,
  Icon,
  Skeleton,
  Stack,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { FaClock } from "react-icons/fa6"
import { MdHowToVote } from "react-icons/md"
import { PiSquaresFourFill } from "react-icons/pi"
import { ethers } from "ethers"
import { FaVoteYea } from "react-icons/fa"
import { useTranslation } from "react-i18next"

const compactFormatter = getCompactFormatter()
type Props = {
  roundId: string
}

export const AllocationRoundDetails = ({ roundId }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data, isLoading } = useAllocationsRound(roundId)

  const { data: roundAmount, isLoading: roundAmountLoading, error: roundAmountError } = useAllocationAmount(roundId)
  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(roundId, account ?? undefined)
  const { data: userVotes, isLoading: userVotesLoading } = useUserVotesInRound(roundId, account ?? undefined)
  const { data: baseAmount, isLoading: baseAmountLoading, error: baseAmountError } = useAllocationBaseAmount(roundId)

  const totalVotesCast = useMemo(() => {
    return userVotes?.voteWeights.reduce((acc, curr) => acc + Number(ethers.formatEther(curr)), 0) ?? 0
  }, [userVotes?.voteWeights])
  const {
    data: maxDAppAllocation,
    isLoading: maxDAppAllocationLoading,
    error: maxDAppAllocationError,
  } = useMaxAllocationAmount(roundId)

  const { data: roundApps, isLoading: roundAppsLoading } = useRoundXApps(roundId)

  const bgGradient = useColorModeValue("500", "300")

  const remainingTime = useMemo(() => {
    return `${data?.voteEndTimestamp?.fromNow(true)}`
  }, [data?.voteEndTimestamp])

  return (
    <Card w="full" borderRadius={"3xl"} variant={"baseWithBorder"}>
      <CardBody>
        <Stack direction={["column", "row"]} justify="space-between" spacing={12} w="full">
          <VStack spacing={4} align="flex-start" flex={2}>
            <VStack spacing={2} align="flex-start">
              <Skeleton isLoaded={!isLoading}>
                <Text color="#6A6A6A" fontSize={["md"]} textTransform={"uppercase"} fontWeight={600}>
                  {t("Round #{{round}}", {
                    round: data?.roundId,
                  })}
                </Text>
              </Skeleton>
              <Skeleton isLoaded={!isLoading}>
                <Heading size={["lg", "xl"]} data-testid="round-title">
                  {t("Allocations")}
                </Heading>
              </Skeleton>
              <AllocationStateBadge roundId={roundId} />
            </VStack>

            <Skeleton isLoaded={!isLoading}>
              <Text color="gray.500" fontSize={["sm", "md"]}>
                {
                  "Vote for your preferred app to determine funding from the Apps allocation budget. More votes mean more funding. Plus, earn rewards from the Voting Rewards allocation by voting in this round. This allocation process repeats every week."
                }
              </Text>
            </Skeleton>
            <Divider color={"#D5D5D5"} />
            <Stack
              direction={["column", "column", "row"]}
              w="full"
              justify={["flex-start", "flex-start", "space-between"]}
              spacing={8}>
              <Stack
                direction={["column", "column", "row"]}
                spacing={[4, 4, 12]}
                align={["flex-start", "flex-start", "center"]}>
                <Box>
                  <Text color="#6A6A6A" fontSize={["lg", "lg", "md"]} fontWeight={400}>
                    {t("Finishes in")}
                  </Text>
                  <Skeleton isLoaded={!isLoading}>
                    <HStack spacing={2}>
                      <Icon as={FaClock} boxSize={4} color={"#252525"} />
                      <Text fontSize={["lg", "lg", "md"]} color={"#252525"} fontWeight={400}>
                        {remainingTime}
                      </Text>
                    </HStack>
                  </Skeleton>
                </Box>
                <Box>
                  <Text color="#6A6A6A" fontSize={["lg", "lg", "md"]} fontWeight={400}>
                    {t("Participating")}
                  </Text>
                  <Skeleton isLoaded={!roundAppsLoading}>
                    <HStack spacing={2}>
                      <Icon as={PiSquaresFourFill} boxSize={4} color={"#252525"} />
                      <Text fontSize={["lg", "lg", "md"]} color={"#252525"} fontWeight={400}>
                        {t("{{apps}} apps", { apps: roundApps?.length ?? 0 })}
                      </Text>
                    </HStack>
                  </Skeleton>
                </Box>
                <Box>
                  <Text color="#6A6A6A" fontSize={["lg", "lg", "md"]} fontWeight={400}>
                    {t("Your vote")}
                  </Text>
                  <Skeleton isLoaded={!hasVotedLoading && !userVotesLoading}>
                    <HStack spacing={2}>
                      <Icon as={hasVoted ? FaVoteYea : MdHowToVote} boxSize={4} color={"#252525"} />
                      <Text fontSize={["lg", "lg", "md"]} color={"#252525"} fontWeight={400}>
                        {hasVoted ? getCompactFormatter(2).format(totalVotesCast) : "You have not voted"}
                      </Text>
                    </HStack>
                  </Skeleton>
                </Box>
              </Stack>
              <Button
                variant={"primaryAction"}
                as="a"
                href="#user-votes"
                size={"lg"}
                colorScheme={"primary"}
                w={["full", "auto"]}
                leftIcon={<Icon as={MdHowToVote} boxSize={4} />}>
                {t("Cast your vote")}
              </Button>
            </Stack>
          </VStack>
          <VStack flex={1}>
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
                  <Skeleton isLoaded={!maxDAppAllocationLoading}>
                    {maxDAppAllocationError ? (
                      <Text color="red.500">{maxDAppAllocationError.message}</Text>
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
