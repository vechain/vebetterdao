import {
  useAllocationsRound,
  useAllocationsRoundState,
  useHasVotedInRound,
  useRoundXApps,
  useUserVotesInRound,
} from "@/api"
import { AllocationStateBadge, VOT3Icon } from "@/components"
import {
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  HStack,
  Heading,
  Icon,
  Skeleton,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { FaClock } from "react-icons/fa6"
import { MdHowToVote } from "react-icons/md"
import { PiSquaresFourFill } from "react-icons/pi"
import { ethers } from "ethers"
import { useTranslation } from "react-i18next"
import { AllocationRoundBreakdownChart } from "./AllocationRoundBreakdownChart"

const compactFormatter = getCompactFormatter(2)
type Props = {
  roundId: string
}

export const AllocationRoundHeaderCard = ({ roundId }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data, isLoading } = useAllocationsRound(roundId)

  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(roundId, account ?? undefined)
  const { data: userVotes, isLoading: userVotesLoading } = useUserVotesInRound(roundId, account ?? undefined)

  const totalVotesCast = useMemo(() => {
    return userVotes?.voteWeights.reduce((acc, curr) => acc + Number(ethers.formatEther(curr)), 0) ?? 0
  }, [userVotes?.voteWeights])

  const { data: roundApps, isLoading: roundAppsLoading } = useRoundXApps(roundId)

  const { data: roundState, isLoading: roundStateLoading } = useAllocationsRoundState(roundId)

  const isFinished = useMemo(() => {
    return roundState !== 0
  }, [roundState])
  const remainingTime = useMemo(() => {
    // remove prefix/suffix
    if (isFinished) return `${data?.voteEndTimestamp?.fromNow()}`
    return `${data?.voteEndTimestamp?.fromNow(true)}`
  }, [data?.voteEndTimestamp, isFinished])

  return (
    <Card w="full" borderRadius={"3xl"} variant={"baseWithBorder"}>
      <CardBody>
        <Stack direction={["column", "row"]} justify="space-between" spacing={12} w="full" alignItems={"stretch"}>
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
                  <Skeleton isLoaded={!roundStateLoading}>
                    <Text color="#6A6A6A" fontSize={["lg", "lg", "md"]} fontWeight={400}>
                      {isFinished ? t("Finished") : t("Finishes in")}
                    </Text>
                  </Skeleton>
                  <Skeleton isLoaded={!isLoading && !roundStateLoading}>
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
                      <Icon as={hasVoted ? VOT3Icon : MdHowToVote} boxSize={4} color={"#252525"} />
                      <Text fontSize={["lg", "lg", "md"]} color={"#252525"} fontWeight={400}>
                        {hasVoted ? compactFormatter.format(totalVotesCast) : "You have not voted"}
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
            <AllocationRoundBreakdownChart roundId={roundId} />
          </VStack>
        </Stack>
      </CardBody>
    </Card>
  )
}
