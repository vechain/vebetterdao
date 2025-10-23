"use client"
import { Alert, Button, Card, HStack, Heading, Skeleton, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback, useLayoutEffect, useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"

import { SeeVoteDetailsModal } from "@/app/rounds/components/AllocationRoundUserVotes/SeeVoteDetailsModal"
import { AppVotesBreakdown } from "@/app/rounds/components/AppVotesBreakdown/AppVotesBreakdown"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { useTotalVotesOnBlock } from "../../../../../../api/contracts/governance/hooks/useTotalVotesOnBlock"
import { useAllocationsRound } from "../../../../../../api/contracts/xAllocations/hooks/useAllocationsRound"
import { useAllocationsRoundState } from "../../../../../../api/contracts/xAllocations/hooks/useAllocationsRoundState"
import { useHasVotedInRound } from "../../../../../../api/contracts/xAllocations/hooks/useHasVotedInRound"
import { useUserVotingPreferences } from "../../../../../../api/contracts/xAllocations/hooks/useUserVotingPreferences"
import { useRoundXApps } from "../../../../../../api/contracts/xApps/hooks/useRoundXApps"
import { ButtonClickProperties, buttonClickActions, buttonClicked } from "../../../../../../constants/AnalyticsEvents"
import { useCastAllocationVotes, CastAllocationVotesProps } from "../../../../../../hooks/useCastAllocationVotes"
import { useVotingFlowState } from "../../../../../../hooks/useVotingFlowState"
import {
  CastAllocationVoteFormData,
  useCastAllocationFormStore,
} from "../../../../../../store/useCastAllocationFormStore"
import AnalyticsUtils from "../../../../../../utils/AnalyticsUtils/AnalyticsUtils"
import { scaledDivision } from "../../../../../../utils/MathUtils/MathUtils"
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
  const { data: votes, isAutomationEnabled, setHasInitializedFromBlockchain } = useCastAllocationFormStore()
  const { data: currentVotingPreferences } = useUserVotingPreferences(account?.address)

  // Centralized voting flow state
  const votingFlow = useVotingFlowState({
    roundId,
    account: account?.address,
    selectedApps: votes,
    isAutomationEnabled,
  })
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

  // Only need loading state here - hasVoted data comes from votingFlow.userStatus.hasVoted
  const { isLoading: hasVotedLoading } = useHasVotedInRound(roundId, account?.address ?? undefined)
  const isVotingConcluded = roundInfo?.voteEndTimestamp?.isBefore() && [1, 2].includes(state ?? 0)

  const seeAllModal = useDisclosure()

  const onSuccess = useCallback(() => {
    closeTxModal()
    // Reset initialization flag so next visit syncs fresh data from blockchain
    setHasInitializedFromBlockchain(false)
    router.push(`/rounds/${roundId}`)
  }, [router, roundId, closeTxModal, setHasInitializedFromBlockchain])

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
    automation: {
      enabled: isAutomationEnabled,
      appIds: votes.map(vote => vote.appId),
      userAddress: account?.address ?? "",
      isAlreadyAutoVotingEnabledInCurrentRound: votingFlow.automationStatus.activeInCurrentRound,
      currentAutoVotingStatus: votingFlow.automationStatus.currentlyEnabled,
      currentAppPreferences: currentVotingPreferences,
    },
  })

  const totalVotesToCast = useMemo(() => {
    return (votes.reduce((acc, vote) => acc + Number(vote.rawValue), 0) * Number(votesAtSnapshot)) / 100
  }, [votes, votesAtSnapshot])

  // Use centralised voting flow state for UI decisions
  const isDisablingAutoVote = votingFlow.ui.showDisablingAutoVoteAlert
  const hasChanges = votingFlow.changes.hasAnyChanges

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
      value: votingFlow.navigation.canAccessConfirmPage && !isVotingConcluded,
      loading: hasVotedLoading || stateLoading || votesAtSnapshotLoading,
    }
  }, [
    votingFlow.navigation.canAccessConfirmPage,
    hasVotedLoading,
    isVotingConcluded,
    stateLoading,
    votesAtSnapshotLoading,
  ])

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

          {/* Show info if user has already voted and is updating preferences */}
          {votingFlow.ui.showUpdatingPreferencesAlert && (
            <Alert.Root status="info" borderRadius="2xl" w="full">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{t("Updating automation preferences")}</Alert.Title>
                <Alert.Description textStyle="sm">
                  {t("This will update your automation preferences.")}
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}

          {/* Show different content based on whether user is disabling auto-vote */}
          {isDisablingAutoVote ? (
            <>
              <Alert.Root status="info" borderRadius="2xl" w="full">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>{t("Disabling automation")}</Alert.Title>
                  <Alert.Description textStyle="sm">
                    {t("This action will take effect starting next round.")}
                  </Alert.Description>
                </Alert.Content>
              </Alert.Root>
            </>
          ) : (
            <>
              {!votingFlow.userStatus.hasVoted && (
                <Text textStyle={"md"} color="text.subtle">
                  {t("Review your vote details below. Go back if you need to make changes.")}
                </Text>
              )}

              {!hasChanges && (
                <Alert.Root status="warning" borderRadius="2xl" w="full">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>{t("No changes detected")}</Alert.Title>
                  </Alert.Content>
                </Alert.Root>
              )}

              {!votingFlow.userStatus.hasVoted && (
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
              )}

              {votingFlow.userStatus.hasVoted && (
                <Card.Root bg={{ base: "transparent", md: "card.subtle" }} px={{ base: "0", md: "6" }} w="full">
                  <VStack flex={1} w="full" gap={8} align={"flex-start"}>
                    <VStack gap={2} align="flex-start" w="full">
                      <Heading size={["xl", "xl", "2xl"]} fontWeight="bold">
                        {t("Your automation preferences")}
                      </Heading>
                      <Text textStyle="md">
                        <Trans i18nKey={"{{apps}} apps selected"} values={{ apps: votes.length }} t={t} />
                      </Text>
                    </VStack>
                    <AppVotesBreakdown votes={parsedVotes} />
                  </VStack>
                </Card.Root>
              )}
            </>
          )}

          <CastAllocationControlsBottomBar
            onContinue={onContinue}
            continueDisabled={!hasChanges}
            helperText={
              <Text textStyle={"md"} color={"#F29B32"} textAlign={["center", "center", "left"]}>
                {hasChanges ? (
                  <Trans i18nKey={"Once your transaction is submitted, you will not be able to revert it."} t={t} />
                ) : (
                  t("Modify your preferences to continue")
                )}
              </Text>
            }
          />
        </VStack>
      </Card.Root>
    </>
  )
}
