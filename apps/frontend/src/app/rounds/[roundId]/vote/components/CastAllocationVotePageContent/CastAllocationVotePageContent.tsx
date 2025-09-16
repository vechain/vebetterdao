"use client"
import { useCanUserVote, useRoundXApps } from "@/api"
import { Heading, Text, VStack } from "@chakra-ui/react"
import { useCallback, useLayoutEffect, useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Trans, useTranslation } from "react-i18next"
import { CastAllocationVoteFormData, useCastAllocationFormStore } from "@/store"
import { SearchAndSelectApps } from "./components/SearchAndSelectApps"
import { ResponsiveCard } from "@/components"
import { CastAllocationControlsBottomBar } from "../CastAllocationControlsBottomBar"
import { AnalyticsUtils } from "@/utils"
import { ButtonClickProperties, buttonClickActions, buttonClicked } from "@/constants"

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
    <ResponsiveCard>
      <VStack w="full" gap={8} align={"flex-start"}>
        <Heading size={["2xl", "2xl", "4xl"]}>{t("Select the apps you want to vote")}</Heading>
        <Text textStyle={"md"} color="text.subtle">
          {t(
            "The apps you vote will receive a B3TR allocation to distribute among its users as rewards for completing sustainable actions. Select your favorite apps to add them to your vote.",
          )}
        </Text>

        <SearchAndSelectApps
          selectedApps={parsedVotes}
          onSelectedAppsChange={handleOnSelectedAppsChange}
          xApps={xAppsQuery.data}
          isLoading={xAppsQuery.isLoading}
        />

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
    </ResponsiveCard>
  )
}
