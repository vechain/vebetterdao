"use client"
import { Alert, Card, Heading, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback, useLayoutEffect, useMemo, useState, useEffect } from "react"
import { Trans, useTranslation } from "react-i18next"

import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { useCanUserVote } from "../../../../../../api/contracts/governance/hooks/useCanUserVote"
import { useHasVotedInRound } from "../../../../../../api/contracts/xAllocations/hooks/useHasVotedInRound"
import { useIsAutoVotingEnabled } from "../../../../../../api/contracts/xAllocations/hooks/useIsAutoVotingEnabled"
import { useIsAutoVotingEnabledInCurrentRound } from "../../../../../../api/contracts/xAllocations/hooks/useIsAutoVotingEnabledInCurrentRound"
import { useUserVotingPreferences } from "../../../../../../api/contracts/xAllocations/hooks/useUserVotingPreferences"
import { useRoundXApps } from "../../../../../../api/contracts/xApps/hooks/useRoundXApps"
import { ButtonClickProperties, buttonClickActions, buttonClicked } from "../../../../../../constants/AnalyticsEvents"
import { useUpdateAutomationPreferences } from "../../../../../../hooks/useUpdateAutomationPreferences"
import {
  useCastAllocationFormStore,
  CastAllocationVoteFormData,
} from "../../../../../../store/useCastAllocationFormStore"
import AnalyticsUtils from "../../../../../../utils/AnalyticsUtils/AnalyticsUtils"
import { splitEvenly } from "../../utils/splitEvenly"
import { CastAllocationControlsBottomBar } from "../CastAllocationControlsBottomBar"

import { AutomationCard } from "./components/AutomationCard"
import { SearchAndSelectApps } from "./components/SearchAndSelectApps"

const MAX_AUTOMATED_APPS_SELECTION = 15

type Props = {
  roundId: string
}

export const CastAllocationPageVoteContent = ({ roundId }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const { onClose: closeTxModal } = useTransactionModal()
  const xAppsQuery = useRoundXApps(roundId)
  const {
    data: selectedApps,
    setData: onSelectedAppsChange,
    filterValidApps,
    isAutomationEnabled,
    setIsAutomationEnabled,
    hasInitializedFromBlockchain,
    setHasInitializedFromBlockchain,
  } = useCastAllocationFormStore()

  // Check if user has already voted in this round
  const { data: hasVotedInRound } = useHasVotedInRound(roundId, account?.address)
  // Get current automation status
  const { data: currentAutoVotingStatus } = useIsAutoVotingEnabled(account?.address)
  // Check if auto-voting was enabled at the start of current round
  const { data: isAutoVotingEnabledInCurrentRound } = useIsAutoVotingEnabledInCurrentRound(account?.address)
  // Get current voting preferences
  const { data: currentVotingPreferences } = useUserVotingPreferences(account?.address)

  // Handle the case when user has data in LS but the app is not active anymore
  const parsedVotes: CastAllocationVoteFormData[] = useMemo(() => {
    return selectedApps
      .filter(vote => vote.rawValue > 0 && xAppsQuery.data?.find(app => app.id === vote.appId))
      .map(vote => {
        return {
          appId: vote.appId,
          rawValue: vote.rawValue,
          value: vote.value,
        }
      })
  }, [selectedApps, xAppsQuery])
  const [onContinueError, setOnContinueError] = useState<string | null>(null)

  // Sync toggle state from blockchain ONCE on initial load
  // After that, preserve user's intent (uncommitted changes) during navigation
  useEffect(() => {
    if (currentAutoVotingStatus !== undefined && !hasInitializedFromBlockchain) {
      setIsAutomationEnabled(currentAutoVotingStatus)
      setHasInitializedFromBlockchain(true)
    }
  }, [currentAutoVotingStatus, setIsAutomationEnabled, hasInitializedFromBlockchain, setHasInitializedFromBlockchain])

  // Load existing preferences when user has voted
  useEffect(() => {
    if (hasVotedInRound && currentVotingPreferences && currentVotingPreferences.length > 0) {
      // Set app selections with equal distribution
      const equallyDistributedPrefs = currentVotingPreferences.map(appId => ({
        appId,
        ...splitEvenly(currentVotingPreferences.length),
      }))
      onSelectedAppsChange(equallyDistributedPrefs)
    }
  }, [hasVotedInRound, currentVotingPreferences, onSelectedAppsChange])

  // Setup update automation preferences hook
  const onUpdateSuccess = useCallback(() => {
    closeTxModal()
    // Reset initialization flag so next visit syncs fresh data from blockchain
    setHasInitializedFromBlockchain(false)
    router.push(`/rounds/${roundId}`)
  }, [router, roundId, closeTxModal, setHasInitializedFromBlockchain])

  // TODO: Add translation
  const updateAutomationPreferences = useUpdateAutomationPreferences({
    onSuccess: onUpdateSuccess,
    transactionModalCustomUI: {
      waitingConfirmation: {
        title: "Updating automation preferences...",
      },
      success: {
        title: "Automation preferences updated successfully!",
      },
      error: {
        title: "Error updating automation preferences!",
      },
    },
  })

  const handleAutomationChange = useCallback(
    (enabled: boolean) => {
      setIsAutomationEnabled(enabled)
      // If automation is enabled, ensure apps are equally split and limit to max selection
      if (enabled) {
        const appsToKeep = selectedApps.slice(0, MAX_AUTOMATED_APPS_SELECTION)
        const equallyDistributedApps = appsToKeep.map(app => ({
          ...app,
          ...splitEvenly(appsToKeep.length),
        }))
        onSelectedAppsChange(equallyDistributedApps)
      }
    },
    [selectedApps, onSelectedAppsChange, setIsAutomationEnabled],
  )

  const handleOnSelectedAppsChange = useCallback(
    (data: CastAllocationVoteFormData[]) => {
      setOnContinueError(null)
      onSelectedAppsChange(data)
    },
    [onSelectedAppsChange],
  )

  const onContinue = useCallback(() => {
    if (!selectedApps.length) return setOnContinueError(t("Select at least one app to continue"))

    // If user has already voted, update automation preferences directly
    if (hasVotedInRound) {
      const automationStateChanged = currentAutoVotingStatus !== isAutomationEnabled
      const appPreferencesChanged =
        JSON.stringify(currentVotingPreferences?.sort()) !== JSON.stringify(selectedApps.map(app => app.appId).sort())

      // Only send transaction if something changed
      if (automationStateChanged || appPreferencesChanged) {
        updateAutomationPreferences.sendTransaction({
          appIds: selectedApps.map(app => app.appId),
          toggleAutomation: automationStateChanged,
          userAddress: account?.address ?? "",
        })
      } else {
        // Nothing changed, just go back
        router.push(`/rounds/${roundId}`)
      }
      return
    }

    // Skip to confirm page if:
    // 1. Auto-voting was enabled at round start (locked in for this round), OR
    // 2. User is enabling automation now (first time or re-enabling)
    // This prevents bypassing automation flow while allowing new users to enable it
    if (isAutoVotingEnabledInCurrentRound || isAutomationEnabled) {
      router.push(`/rounds/${roundId}/vote/confirm`)
    } else {
      router.push(`/rounds/${roundId}/vote/percentages`)
    }

    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.CONTINUE_CASTING_VOTE_SELECTION))
  }, [
    router,
    roundId,
    selectedApps,
    t,
    isAutomationEnabled,
    isAutoVotingEnabledInCurrentRound,
    hasVotedInRound,
    currentAutoVotingStatus,
    currentVotingPreferences,
    updateAutomationPreferences,
    account?.address,
  ])

  const shouldSeeThePage = useCanUserVote()

  // Determine if page should be accessible
  // Allow access if: user can vote OR user has already voted
  const canAccessPage = shouldSeeThePage.data || hasVotedInRound

  // Clean up invalid app selections when xApps data is loaded
  useEffect(() => {
    if (xAppsQuery.data && selectedApps.length > 0) {
      const validAppIds = xAppsQuery.data.map(app => app.id)
      filterValidApps(validAppIds)
    }
  }, [xAppsQuery.data, selectedApps.length, filterValidApps])

  // Redirect to round page if user can't access this page
  useLayoutEffect(() => {
    if (shouldSeeThePage.isLoading) return
    if (!canAccessPage) {
      router.push(`/rounds/${roundId}`)
    }
  }, [canAccessPage, shouldSeeThePage.isLoading, roundId, router])

  if (!canAccessPage && !shouldSeeThePage.isLoading) return null

  return (
    <Card.Root bg={{ base: "transparent", md: "bg.primary" }} px={{ base: "0", md: "6" }} w="full">
      <VStack w="full" gap={4} align={"flex-start"}>
        <Heading size={["xl", "xl", "2xl"]}>{t("Select the apps you want to vote")}</Heading>
        <Text textStyle={"md"} color="text.subtle">
          {t(
            "The apps you vote will receive a B3TR allocation to distribute among its users as rewards for completing sustainable actions. Select your favorite apps to add them to your vote.",
          )}
        </Text>

        <AutomationCard isAutomationEnabled={isAutomationEnabled} onAutomationChange={handleAutomationChange} />

        {/* Show info if auto-voting is enabled for current round */}
        {/* User can still disable auto-voting (takes effect next round) and update preferences */}
        {isAutoVotingEnabledInCurrentRound && (
          <Alert.Root status="info" borderRadius="2xl" w="full">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t("Auto-voting is active for this round")}</Alert.Title>
              <Alert.Description textStyle="sm">
                {t("You can disable auto-voting (takes effect next round) or update your app preferences.")}
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        <SearchAndSelectApps
          selectedApps={parsedVotes}
          onSelectedAppsChange={handleOnSelectedAppsChange}
          xApps={xAppsQuery.data}
          isLoading={xAppsQuery.isLoading}
          maxSelections={isAutomationEnabled ? MAX_AUTOMATED_APPS_SELECTION : undefined}
        />

        {isAutomationEnabled && selectedApps.length >= MAX_AUTOMATED_APPS_SELECTION && (
          <Alert.Root status="info" borderRadius="2xl" w="full">
            <Alert.Indicator />
            <Alert.Content textStyle="sm">
              <Trans
                t={t}
                i18nKey="You can select up to {{amount}} dApps when automation is on. To add more, disable automation."
                values={{ amount: MAX_AUTOMATED_APPS_SELECTION }}
              />
            </Alert.Content>
          </Alert.Root>
        )}

        <CastAllocationControlsBottomBar
          onContinue={onContinue}
          helperText={
            onContinueError ? (
              <Text textStyle={"md"} fontWeight="semibold" color="status.negative.primary">
                {onContinueError}
              </Text>
            ) : (
              <Text textStyle={"md"}>
                <Trans i18nKey={"{{amount}} selected apps"} values={{ amount: selectedApps?.length ?? 0 }} t={t} />
              </Text>
            )
          }
        />
      </VStack>
    </Card.Root>
  )
}
