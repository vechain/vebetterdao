import { Box, Button, Card, Separator, HStack, Heading, Icon, Skeleton, Stack, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FaClock } from "react-icons/fa6"
import { MdHowToVote } from "react-icons/md"
import { PiSquaresFourFill } from "react-icons/pi"

import { useCanUserVote } from "../../../../api/contracts/governance/hooks/useCanUserVote"
import { useTotalVotesOnBlock } from "../../../../api/contracts/governance/hooks/useTotalVotesOnBlock"
import { useVotingThreshold } from "../../../../api/contracts/governance/hooks/useVotingThreshold"
import { useAllocationsRound } from "../../../../api/contracts/xAllocations/hooks/useAllocationsRound"
import { useAllocationsRoundState } from "../../../../api/contracts/xAllocations/hooks/useAllocationsRoundState"
import { useHasVotedInRound } from "../../../../api/contracts/xAllocations/hooks/useHasVotedInRound"
import { useRoundXApps } from "../../../../api/contracts/xApps/hooks/useRoundXApps"
import { useUserVotesInRound } from "../../../../api/contracts/xApps/hooks/useUserVotesInRound"
import { AllocationStateBadge } from "../../../../components/AllocationStateBadge/AllocationStateBadge"
import { VOT3Icon } from "../../../../components/Icons/VOT3Icon"
import { ButtonClickProperties, buttonClickActions, buttonClicked } from "../../../../constants/AnalyticsEvents"
import AnalyticsUtils from "../../../../utils/AnalyticsUtils/AnalyticsUtils"

import { AllocationRoundBreakdownChart } from "./AllocationRoundBreakdownChart"

const compactFormatter = getCompactFormatter(2)
type Props = {
  roundId: string
}
export const AllocationRoundHeaderCard = ({ roundId }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const { data, isLoading } = useAllocationsRound(roundId)
  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(roundId, account?.address ?? undefined)
  const { data: userVotes, isLoading: userVotesLoading } = useUserVotesInRound(roundId, account?.address ?? undefined)
  const totalVotesAtSnapshotQuery = useTotalVotesOnBlock(
    data?.voteStart ? Number(data.voteStart) : undefined,
    account?.address ?? "",
  )
  const votesAtSnapshot = totalVotesAtSnapshotQuery.data?.totalVotesWithDeposits
  const votesAtSnapshotLoading = totalVotesAtSnapshotQuery.isLoading
  const { data: threshold } = useVotingThreshold()

  const totalVotesCast = useMemo(() => {
    return userVotes?.voteWeights?.reduce((acc, curr) => acc + Number(ethers.formatEther(curr)), 0) ?? 0
  }, [userVotes?.voteWeights])

  const { data: roundApps, isLoading: roundAppsLoading } = useRoundXApps(roundId)

  const { data: roundState, isLoading: roundStateLoading } = useAllocationsRoundState(roundId)

  const hasVotesAtSnapshot = useMemo(() => {
    return Number(votesAtSnapshot ?? 0) >= Number(threshold ?? 0)
  }, [votesAtSnapshot, threshold])

  const isFinished = useMemo(() => {
    return roundState !== undefined && roundState !== 0
  }, [roundState])
  const remainingTime = useMemo(() => {
    // remove prefix/suffix
    if (isFinished) return `${data?.voteEndTimestamp?.fromNow()}`
    return `${data?.voteEndTimestamp?.fromNow(true)}`
  }, [data?.voteEndTimestamp, isFinished])

  const navigateToVote = useCallback(() => {
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.CASTING_VOTE))
    router.push("/allocations/vote")
  }, [router])

  const { data: shouldSeeVoteButton, isLoading: shouldSeeVoteButtonLoading } = useCanUserVote()

  const yourVoteText = useMemo(() => {
    if (hasVoted) return compactFormatter.format(totalVotesCast)
    if (isFinished || hasVotesAtSnapshot) return t("You have not voted")

    return t("No votes to cast")
  }, [hasVoted, hasVotesAtSnapshot, totalVotesCast, isFinished, t])

  return (
    <Card.Root w="full" borderRadius={"3xl"} variant="primary" data-testid="allocation-round-header-card">
      <Card.Body>
        <Stack direction={["column", "row"]} justify="space-between" gap={12} w="full" alignItems={"stretch"}>
          <VStack gap={4} align="flex-start" flex={2}>
            <VStack gap={2} align="flex-start">
              <Text
                color="text.subtle"
                textStyle="lg"
                textTransform={"uppercase"}
                fontWeight="semibold"
                data-testid="round-title">
                {t("Round #{{round}}", {
                  round: roundId,
                })}
              </Text>
              <Heading size={["lg", "xl"]}>{t("Allocations")}</Heading>
              <AllocationStateBadge roundId={roundId} />
            </VStack>

            <Skeleton loading={isLoading}>
              <Text color="gray.500" textStyle={["sm", "md"]}>
                {t(
                  "Vote for your preferred app to determine funding from the Apps allocation budget. More votes mean more funding. Plus, earn rewards from the Voting Rewards allocation by voting in this round. This allocation process repeats every week.",
                )}
              </Text>
            </Skeleton>
            <Separator color={"#D5D5D5"} />
            <Stack
              direction={["column", "column", "row"]}
              w="full"
              justify={["flex-start", "flex-start", "space-between"]}
              gap={8}>
              <Stack
                direction={["column", "column", "row"]}
                gap={[4, 4, 12]}
                align={["flex-start", "flex-start", "center"]}>
                <Box>
                  <Skeleton loading={roundStateLoading}>
                    <Text color="text.subtle" textStyle={["lg", "lg", "md"]}>
                      {isFinished ? t("Finished") : t("Finishes in")}
                    </Text>
                  </Skeleton>
                  <Skeleton loading={isLoading || roundStateLoading}>
                    <HStack gap={2}>
                      <Icon as={FaClock} boxSize={4} color="contrast-fg-on-muted" />
                      <Text textStyle={["lg", "lg", "md"]}>{remainingTime}</Text>
                    </HStack>
                  </Skeleton>
                </Box>
                <Box>
                  <Text color="text.subtle" textStyle={["lg", "lg", "md"]}>
                    {t("Participating")}
                  </Text>
                  <Skeleton loading={roundAppsLoading}>
                    <HStack gap={2}>
                      <Icon as={PiSquaresFourFill} boxSize={4} />
                      <Text textStyle={["lg", "lg", "md"]}>{t("{{apps}} apps", { apps: roundApps?.length ?? 0 })}</Text>
                    </HStack>
                  </Skeleton>
                </Box>
                {!!account?.address && (
                  <Box data-testid="your-vote-box">
                    <Text color="text.subtle" textStyle={["lg", "lg", "md"]}>
                      {t("Your vote")}
                    </Text>
                    <Skeleton loading={hasVotedLoading || userVotesLoading || votesAtSnapshotLoading}>
                      <HStack gap={2}>
                        {hasVoted ? (
                          <VOT3Icon boxSize={4} colorVariant="dark" />
                        ) : (
                          <Icon as={MdHowToVote} boxSize={4} />
                        )}
                        <Text textStyle={["lg", "lg", "md"]}>{yourVoteText}</Text>
                      </HStack>
                    </Skeleton>
                  </Box>
                )}
              </Stack>
              {!shouldSeeVoteButtonLoading && shouldSeeVoteButton && !isFinished && (
                <Button
                  data-testid="cast-your-vote-button"
                  variant={"primary"}
                  onClick={navigateToVote}
                  size={"lg"}
                  colorPalette={"primary"}
                  w={["full", "auto"]}>
                  <Icon as={MdHowToVote} boxSize={4} />
                  {t("Cast your vote")}
                </Button>
              )}
            </Stack>
          </VStack>
          <VStack flex={1}>
            <AllocationRoundBreakdownChart roundId={roundId} />
          </VStack>
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}
