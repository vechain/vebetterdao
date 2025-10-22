"use client"
import { Alert, Card, Heading, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback, useLayoutEffect, useMemo, useState, useEffect } from "react"
import { Trans, useTranslation } from "react-i18next"

import { useUserVotingPreferences } from "../../../../../../api/contracts/xAllocations/hooks/useUserVotingPreferences"
import { useRoundXApps } from "../../../../../../api/contracts/xApps/hooks/useRoundXApps"
import { ButtonClickProperties, buttonClickActions, buttonClicked } from "../../../../../../constants/AnalyticsEvents"
import { useVotingFlowState } from "../../../../../../hooks/useVotingFlowState"
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

  // Get current voting preferences for loading existing preferences
  const { data: currentVotingPreferences } = useUserVotingPreferences(account?.address)

  // Centralised voting flow state
  const votingFlow = useVotingFlowState({
    roundId,
    account: account?.address,
    selectedApps,
    isAutomationEnabled,
  })

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
    if (votingFlow.automationStatus.currentlyEnabled !== undefined && !hasInitializedFromBlockchain) {
      setIsAutomationEnabled(votingFlow.automationStatus.currentlyEnabled)
      setHasInitializedFromBlockchain(true)
    }
  }, [
    votingFlow.automationStatus.currentlyEnabled,
    setIsAutomationEnabled,
    hasInitializedFromBlockchain,
    setHasInitializedFromBlockchain,
  ])

  // Load existing preferences when user has voted
  useEffect(() => {
    if (votingFlow.userStatus.hasVoted && currentVotingPreferences && currentVotingPreferences.length > 0) {
      // Set app selections with equal distribution
      const equallyDistributedPrefs = currentVotingPreferences.map(appId => ({
        appId,
        ...splitEvenly(currentVotingPreferences.length),
      }))
      onSelectedAppsChange(equallyDistributedPrefs)
    }
  }, [votingFlow.userStatus.hasVoted, currentVotingPreferences, onSelectedAppsChange])

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

    // Determine next page based on voting flow state
    const nextPage = votingFlow.navigation.shouldGoToConfirm
      ? `/rounds/${roundId}/vote/confirm`
      : `/rounds/${roundId}/vote/percentages`

    router.push(nextPage)
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.CONTINUE_CASTING_VOTE_SELECTION))
  }, [router, roundId, selectedApps, t, votingFlow.navigation.shouldGoToConfirm])

  // Determine if page should be accessible based on voting flow state
  const canAccessPage = votingFlow.navigation.canAccessSelectionPage

  // Clean up invalid app selections when xApps data is loaded
  useEffect(() => {
    if (xAppsQuery.data && selectedApps.length > 0) {
      const validAppIds = xAppsQuery.data.map(app => app.id)
      filterValidApps(validAppIds)
    }
  }, [xAppsQuery.data, selectedApps.length, filterValidApps])

  // Redirect to round page if user can't access this page
  useLayoutEffect(() => {
    // Wait for votingFlow to load (canAccessPage will be false/undefined while loading)
    if (canAccessPage === false) {
      router.push(`/rounds/${roundId}`)
    }
  }, [canAccessPage, roundId, router])

  if (canAccessPage === false) return null

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
        {votingFlow.ui.showAutoVotingActiveAlert && (
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
          continueDisabled={(() => {
            const disabled = !votingFlow.changes.hasAnyChanges || !selectedApps.length
            return disabled
          })()}
          helperText={
            onContinueError ? (
              <Text textStyle={"md"} fontWeight="semibold" color="status.negative.primary">
                {onContinueError}
              </Text>
            ) : !votingFlow.changes.hasAnyChanges ? (
              <Text textStyle={"md"} color="text.subtle">
                {t("Modify your preferences to continue")}
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
