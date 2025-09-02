"use client"
import {
  useAllocationsRound,
  useAllocationsRoundState,
  useHasVotedInRound,
  useVotingThreshold,
  useRoundXApps,
  useTotalVotesOnBlock,
} from "@/api"
import { Button, HStack, Heading, Skeleton, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { useCallback, useLayoutEffect, useMemo } from "react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { Trans, useTranslation } from "react-i18next"
import { CastAllocationVoteFormData, useCastAllocationFormStore } from "@/store"
import { AppVotesBreakdown } from "@/app/rounds/components/AppVotesBreakdown/AppVotesBreakdown"
import { ResponsiveCard } from "@/components"
import { useCastAllocationVotes, CastAllocationVotesProps } from "@/hooks"
import { scaledDivision } from "@/utils/MathUtils"
import { FiArrowUpRight } from "react-icons/fi"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { SeeVoteDetailsModal } from "@/app/rounds/components/AllocationRoundUserVotes/SeeVoteDetailsModal"
import { CastAllocationControlsBottomBar } from "../../components/CastAllocationControlsBottomBar"
import { AnalyticsUtils } from "@/utils"
import { ButtonClickProperties, buttonClickActions, buttonClicked } from "@/constants"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
type Props = {
  roundId: string
}

const compactFormatter = getCompactFormatter(2)
export const ConfirmCastAllocationVotePageContent = ({ roundId }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { onClose: closeTxModal } = useTransactionModal()
  const router = useRouter()

  const xAppsQuery = useRoundXApps(roundId)

  const { data: votes } = useCastAllocationFormStore()

  // Handle the case when user has data in LS but the app is not active anymore
  const parsedVotes: CastAllocationVoteFormData[] = useMemo(() => {
    return votes
      .filter(vote => vote.rawValue > 0 && xAppsQuery.data?.find(app => app.id === vote.appId))
      .map(vote => {
        return {
          appId: vote.appId,
          rawValue: vote.rawValue,
          value: vote.value,
        }
      })
  }, [votes, xAppsQuery])

  const { data: state } = useAllocationsRoundState(roundId)

  const { data: roundInfo, isLoading: stateLoading } = useAllocationsRound(roundId)
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

  const seeAllModal = useDisclosure()

  const onSuccess = useCallback(() => {
    closeTxModal()
    router.push(`/rounds/${roundId}`)
  }, [router, roundId, closeTxModal])

  const castAllocationVotes = useCastAllocationVotes({
    roundId,
    onSuccess,
    transactionModalCustomUI: {
      waitingConfirmation: {
        title: t("Casting your vote..."),
      },
      success: {
        title: t("Vote cast successfully!"),
      },
      error: {
        title: t("Error casting your vote!"),
      },
    },
  })

  const totalVotesToCast = useMemo(() => {
    return (votes.reduce((acc, vote) => acc + Number(vote.rawValue), 0) * Number(votesAtSnapshot)) / 100
  }, [votes, votesAtSnapshot])

  const onContinue = useCallback(() => {
    if (!votesAtSnapshot) throw new Error("Votes at snapshot not found")
    const appVotesPercentagesToValue: CastAllocationVotesProps = votes.map(vote => {
      const rawValue = scaledDivision(Number(vote.rawValue) * Number(votesAtSnapshot), 100)
      return {
        appId: vote.appId,
        votes: rawValue,
      }
    })

    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.CONTINUE_CASTING_VOTE_CONFIRM_TX))
    castAllocationVotes.sendTransaction(appVotesPercentagesToValue)
  }, [castAllocationVotes, votesAtSnapshot, votes])

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
    <>
      <SeeVoteDetailsModal roundId={roundId} votes={votes} isOpen={seeAllModal.open} onClose={seeAllModal.onClose} />

      <ResponsiveCard>
        <VStack w="full" gap={8} align={"flex-start"}>
          <Heading size={["2xl", "2xl", "4xl"]} data-testid={"voting-confirmation-page-title"}>
            {t("Review and confirm")}
          </Heading>
          <Text textStyle={"md"} color="text.subtle">
            {t(
              "Make sure that the apps you selected and the distribution percentages are right. If something’s wrong, you can go back and modify it.",
            )}
          </Text>
          <ResponsiveCard cardProps={{ variant: "filled" }}>
            <VStack flex={1} w="full" gap={8} align={"flex-start"}>
              <VStack gap={2} align="flex-start" w="full">
                <HStack w="full" justify="space-between">
                  <Heading size={["xl", "xl", "2xl"]} fontWeight="bold">
                    {t("Your vote")}
                  </Heading>
                  <Button variant="ghost" colorPalette="primary" onClick={seeAllModal.onOpen}>
                    {t("See details")}
                    <FiArrowUpRight />
                  </Button>
                </HStack>
                <Skeleton loading={votesAtSnapshotLoading}>
                  <Text textStyle="md">
                    <Trans
                      i18nKey={"{{amount}} distributed among {{apps}} apps"}
                      values={{ amount: compactFormatter.format(totalVotesToCast ?? 0), apps: votes.length }}
                      t={t}
                    />
                  </Text>
                </Skeleton>
              </VStack>
              <AppVotesBreakdown votes={parsedVotes} />
            </VStack>
          </ResponsiveCard>

          <CastAllocationControlsBottomBar
            onContinue={onContinue}
            helperText={
              <Text textStyle={"md"} color={"#F29B32"} textAlign={["center", "center", "left"]}>
                <Trans i18nKey={"Once your vote has been cast, you will not be able to revert it."} t={t} />
              </Text>
            }
          />
        </VStack>
      </ResponsiveCard>
    </>
  )
}
