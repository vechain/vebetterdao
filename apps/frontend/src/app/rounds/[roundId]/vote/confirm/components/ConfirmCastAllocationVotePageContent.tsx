"use client"
import { Button, Card, HStack, Heading, Skeleton, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback, useLayoutEffect, useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"
import { parseEther } from "viem"

import { SeeVoteDetailsModal } from "@/app/rounds/components/AllocationRoundUserVotes/SeeVoteDetailsModal"
import { AppVotesBreakdown } from "@/app/rounds/components/AppVotesBreakdown/AppVotesBreakdown"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { useTotalVotesOnBlock } from "../../../../../../api/contracts/governance/hooks/useTotalVotesOnBlock"
import { useVotingThreshold } from "../../../../../../api/contracts/governance/hooks/useVotingThreshold"
import { useAllocationsRound } from "../../../../../../api/contracts/xAllocations/hooks/useAllocationsRound"
import { useAllocationsRoundState } from "../../../../../../api/contracts/xAllocations/hooks/useAllocationsRoundState"
import { useHasVotedInRound } from "../../../../../../api/contracts/xAllocations/hooks/useHasVotedInRound"
import { useRoundXApps } from "../../../../../../api/contracts/xApps/hooks/useRoundXApps"
import { ButtonClickProperties, buttonClickActions, buttonClicked } from "../../../../../../constants/AnalyticsEvents"
import { useCastAllocationVotes, CastAllocationVotesProps } from "../../../../../../hooks/useCastAllocationVotes"
import {
  CastAllocationVoteFormData,
  useCastAllocationFormStore,
} from "../../../../../../store/useCastAllocationFormStore"
import AnalyticsUtils from "../../../../../../utils/AnalyticsUtils/AnalyticsUtils"
import { calculateVotingWeightFromPercentage } from "../../../../../../utils/MathUtils/MathUtils"
import { CastAllocationControlsBottomBar } from "../../components/CastAllocationControlsBottomBar"

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

    const totalVotingPower = parseEther(votesAtSnapshot)
    const appVotesPercentagesToValue: CastAllocationVotesProps = votes.map(vote => {
      const weight = calculateVotingWeightFromPercentage(totalVotingPower, Number(vote.rawValue))
      return {
        appId: vote.appId,
        votesWei: weight.toString(),
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

      <Card.Root bg={{ base: "transparent", md: "bg.primary" }} px={{ base: "0", md: "6" }} w="full">
        <VStack w="full" gap={8} align={"flex-start"}>
          <Heading size={["xl", "xl", "2xl"]} data-testid={"voting-confirmation-page-title"}>
            {t("Review and confirm")}
          </Heading>
          <Text textStyle={"md"} color="text.subtle">
            {t(
              "Make sure that the apps you selected and the distribution percentages are right. If something’s wrong, you can go back and modify it.",
            )}
          </Text>
          <Card.Root bg={{ base: "transparent", md: "card.subtle" }} px={{ base: "0", md: "6" }} w="full">
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
          </Card.Root>

          <CastAllocationControlsBottomBar
            onContinue={onContinue}
            helperText={
              <Text textStyle={"md"} color={"#F29B32"} textAlign={["center", "center", "left"]}>
                <Trans i18nKey={"Once your vote has been cast, you will not be able to revert it."} t={t} />
              </Text>
            }
          />
        </VStack>
      </Card.Root>
    </>
  )
}
