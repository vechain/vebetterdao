"use client"
import {
  useAllocationsRound,
  useAllocationsRoundState,
  useTotalVotesOnBlock,
  useHasVotedInRound,
  useVotingThreshold,
  useRoundXApps,
} from "@/api"
import { Card, Button, HStack, Heading, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useLayoutEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Trans, useTranslation } from "react-i18next"
import { CastAllocationVoteFormData, useCastAllocationFormStore } from "@/store"
import { SelectAppVotesInput } from "./SelectAppVotesInput"
import { scaledDivision } from "@/utils/MathUtils"
import BigNumber from "bignumber.js"
import { CastAllocationControlsBottomBar } from "../../components/CastAllocationControlsBottomBar"
import { AnalyticsUtils } from "@/utils"
import { ButtonClickProperties, buttonClickActions, buttonClicked } from "@/constants"

type Props = {
  roundId: string
}
export const CastAllocationVotePercentagesPageContent = ({ roundId }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const router = useRouter()

  const xAppsQuery = useRoundXApps(roundId)

  const { data: votes, setData: onVotesChange } = useCastAllocationFormStore()

  // Handle the case when user has data in LS but the app is not active anymore
  const parsedVotes: CastAllocationVoteFormData[] = useMemo(() => {
    return votes
      .filter(vote => xAppsQuery.data?.find(app => app.id === vote.appId))
      .map(vote => {
        return {
          appId: vote.appId,
          rawValue: vote.rawValue,
          value: vote.value,
        }
      })
  }, [votes, xAppsQuery])

  const { data: state, isLoading: stateLoading } = useAllocationsRoundState(roundId)

  const { data: roundInfo } = useAllocationsRound(roundId)
  const totalVotesAtSnapshotQuery = useTotalVotesOnBlock(
    roundInfo.voteStart ? Number(roundInfo.voteStart) : undefined,
    account?.address ?? "",
  )
  const votesAtSnapshot = totalVotesAtSnapshotQuery.data?.totalVotesWithDeposits
  const votesAtSnapshotLoading = totalVotesAtSnapshotQuery.isLoading

  const { data: threshold } = useVotingThreshold()

  const hasVotesAtSnapshot = useMemo(() => {
    return Number(votesAtSnapshot ?? 0) >= Number(threshold ?? 0)
  }, [votesAtSnapshot, threshold])

  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(roundId, account?.address ?? undefined)
  const isVotingConcluded = roundInfo?.voteEndTimestamp?.isBefore() && [1, 2].includes(state ?? 0)

  const percentageDistributed = useMemo(() => {
    return votes.reduce((acc, vote) => acc + Number(vote.rawValue), 0)
  }, [votes])

  const isFullyDistributed = percentageDistributed === 100

  const onAppVotesChange = useCallback(
    (index: number) => (data: CastAllocationVoteFormData) => {
      const updatedVotes = votes.map((vote, i) => {
        if (i === index) {
          return data
        }
        return vote
      })
      onVotesChange(updatedVotes)
    },
    [votes, onVotesChange],
  )

  const splitEvenly = useCallback(() => {
    const totalAppsToVote = votes.length
    const rawValue = scaledDivision(100, totalAppsToVote)
    // const remainingPercentage = 100 - rawValue * totalAppsToVote
    const votesPerApp = new BigNumber(rawValue).toFixed(2, BigNumber.ROUND_HALF_DOWN)

    // in case the division is not exact, we add the remaining percentage to a random app
    // const randomAppIndex = Math.floor(Math.random() * totalAppsToVote)
    const updatedVotes = votes.map(vote => {
      //   const parsedRawValue = index === randomAppIndex ? rawValue + remainingPercentage : rawValue
      return { appId: vote.appId, value: votesPerApp, rawValue }
    })
    onVotesChange(updatedVotes)
  }, [votes, onVotesChange])

  const error = useMemo(() => {
    const totalVotes = votes.reduce((acc, vote) => acc + Number(vote.rawValue), 0)
    if (totalVotes > 100) return "Total votes exceed 100"
  }, [votes])

  // Edge case: Check if 1 VOT3 is being split into thirds (which causes rounding issues)
  const showWarning = useMemo(() => {
    if (!votesAtSnapshot) {
      return false
    }

    const totalVotes = Number(votesAtSnapshot)
    const numApps = votes.length

    return totalVotes === 1 && numApps % 3 === 0
  }, [votesAtSnapshot, votes.length])

  const onContinue = useCallback(() => {
    if (error) return
    router.push(`/rounds/${roundId}/vote/confirm`)
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.CONTINUE_CASTING_VOTE_PERCENTAGE))
  }, [router, roundId, error])

  const shouldSeeThePage = useMemo(() => {
    return {
      value: !hasVoted && !isVotingConcluded && hasVotesAtSnapshot && votes.length > 0,
      loading: hasVotedLoading || stateLoading || votesAtSnapshotLoading,
    }
  }, [hasVotedLoading, hasVoted, isVotingConcluded, hasVotesAtSnapshot, stateLoading, votesAtSnapshotLoading, votes])

  //   redirect to round page if user already voted or voting is concluded
  useLayoutEffect(() => {
    if (shouldSeeThePage.loading) return
    if (!shouldSeeThePage.value) {
      router.push(`/rounds/${roundId}`)
    }
  }, [shouldSeeThePage, roundId, router])

  if (!shouldSeeThePage) return null

  return (
    <Card.Root bg={{ base: "transparent", md: "bg.primary" }} px={{ base: "0", md: "6" }} w="full">
      <VStack w="full" gap={4} align="flex-start">
        <Heading size={["xl", "xl", "2xl"]}>{t("Assign percentage of VOT3 to the apps")}</Heading>
        <Text textStyle={"md"} color="text.subtle">
          {t(
            "The apps you vote will receive a B3TR allocation to distribute among its users as rewards for completing sustainable actions. Select your favorite apps to add them to your vote.",
          )}
        </Text>
        <HStack w="full" gap={4} justify={"space-between"}>
          <Heading size={"xl"}>
            <Trans i18nKey={"{{amount}} selected apps"} values={{ amount: votes.length }} t={t} />
          </Heading>
          <Button variant="secondary" onClick={splitEvenly}>
            {t("Split evenly")}
          </Button>
        </HStack>
        <VStack w="full" gap={8} align={"flex-start"}>
          {parsedVotes.map((vote, index) => {
            return (
              <SelectAppVotesInput
                onChange={onAppVotesChange(index)}
                key={vote.appId}
                error={error}
                vote={vote}
                totalVotesAvailable={votesAtSnapshot}
              />
            )
          })}
        </VStack>

        <CastAllocationControlsBottomBar
          onContinue={onContinue}
          helperText={
            error ? (
              <Text textStyle={"md"} fontWeight="semibold" color="status.negative.primary">
                {error}
              </Text>
            ) : showWarning ? (
              <Text textStyle={"md"} color="status.positive.primary">
                <Trans
                  t={t}
                  i18nKey={
                    "With {{amount}} VOT3, voting for {{numApps}} apps may fail due to rounding. Consider voting for fewer apps or getting more VOT3."
                  }
                  values={{ amount: Number(votesAtSnapshot).toFixed(2), numApps: votes.length }}
                />
              </Text>
            ) : (
              <Text textStyle={"md"} color={isFullyDistributed ? "status.positive.primary" : "text.subtle"}>
                <Trans
                  i18nKey={"{{amount}}% distributed"}
                  values={{ amount: percentageDistributed.toFixed(2) }}
                  t={t}
                />
              </Text>
            )
          }
        />
      </VStack>
    </Card.Root>
  )
}
