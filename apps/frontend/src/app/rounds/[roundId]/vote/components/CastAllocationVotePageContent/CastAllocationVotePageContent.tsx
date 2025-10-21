"use client"
import { Alert, Card, Heading, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback, useLayoutEffect, useMemo, useState, useEffect } from "react"
import { Trans, useTranslation } from "react-i18next"

import { useCanUserVote } from "../../../../../../api/contracts/governance/hooks/useCanUserVote"
import { useRoundXApps } from "../../../../../../api/contracts/xApps/hooks/useRoundXApps"
import { ButtonClickProperties, buttonClickActions, buttonClicked } from "../../../../../../constants/AnalyticsEvents"
import {
  useCastAllocationFormStore,
  CastAllocationVoteFormData,
} from "../../../../../../store/useCastAllocationFormStore"
import AnalyticsUtils from "../../../../../../utils/AnalyticsUtils/AnalyticsUtils"
import { CastAllocationControlsBottomBar } from "../CastAllocationControlsBottomBar"

import { AutomationCard } from "./components/AutomationCard"
import { SearchAndSelectApps } from "./components/SearchAndSelectApps"

const MAX_AUTOMATED_APPS_SELECTION = 2

type Props = {
  roundId: string
}

export const CastAllocationPageVoteContent = ({ roundId }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()
  const xAppsQuery = useRoundXApps(roundId)
  const { data: selectedApps, setData: onSelectedAppsChange, filterValidApps } = useCastAllocationFormStore()
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
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false)

  const handleAutomationChange = useCallback(
    (enabled: boolean) => {
      setIsAutomationEnabled(enabled)
      // If automation is enabled and user has more apps selected than the limit, trim to max
      if (enabled && selectedApps.length > MAX_AUTOMATED_APPS_SELECTION) {
        onSelectedAppsChange(selectedApps.slice(0, MAX_AUTOMATED_APPS_SELECTION))
      }
    },
    [selectedApps, onSelectedAppsChange],
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
    router.push(`/rounds/${roundId}/vote/percentages`)
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.CONTINUE_CASTING_VOTE_SELECTION))
  }, [router, roundId, selectedApps, t])

  const shouldSeeThePage = useCanUserVote()

  // Clean up invalid app selections when xApps data is loaded
  useEffect(() => {
    if (xAppsQuery.data && selectedApps.length > 0) {
      const validAppIds = xAppsQuery.data.map(app => app.id)
      filterValidApps(validAppIds)
    }
  }, [xAppsQuery.data, selectedApps.length, filterValidApps])

  //   redirect to round page if user already voted or voting is concluded
  useLayoutEffect(() => {
    if (shouldSeeThePage.isLoading) return
    if (!shouldSeeThePage.data) {
      router.push(`/rounds/${roundId}`)
    }
  }, [shouldSeeThePage, roundId, router])

  if (!shouldSeeThePage.data) return null

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
              {`You can select up to {MAX_AUTOMATED_APPS_SELECTION} dApps when automation is on. To add more, disable
              automation.`}
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
