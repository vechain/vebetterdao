import { Heading, HStack, Skeleton, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useUserActionOverview } from "../../../api/indexer/actions/useUserActionOverview"
import { useUserActionSummaryForDateRange } from "../../../api/indexer/actions/useUserActionSummaryForDateRange"
import { ActivityDayModal } from "../../profile/components/ProfileBetterActions/ActivityDayModal"

import { LastSevenDaysChart } from "./LastSevenDaysChart"
import { LastSevenDaysFirstTime } from "./LastSevenDaysFirstTime"
import { LastSevenDaysInactive } from "./LastSevenDaysInactive"

const compact = getCompactFormatter(2)

type State = "loading" | "first-time" | "inactive" | "active"

type Props = {
  address: string
}

export const LastSevenDaysSection = ({ address }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()

  const today = useMemo(() => dayjs(), [])
  const startDate = useMemo(() => today.subtract(6, "day").format("YYYY-MM-DD"), [today])
  const endDate = useMemo(() => today.format("YYYY-MM-DD"), [today])

  const overviewQuery = useUserActionOverview(address)

  const dailySummariesQuery = useUserActionSummaryForDateRange(address, { startDate, endDate })

  // Walk all pages so the 7-day window is complete (typical case is 1 page).
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = dailySummariesQuery
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const dailySummaries = useMemo(
    () => dailySummariesQuery.data?.pages.flatMap(page => page.data) ?? [],
    [dailySummariesQuery.data],
  )

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const day = today.subtract(6 - i, "day")
      const dateStr = day.format("YYYY-MM-DD")
      const found = dailySummaries.find(s => s.date === dateStr)
      return {
        label: day.format("ddd"),
        date: dateStr,
        actions: found?.actionsRewarded ?? 0,
      }
    })
  }, [dailySummaries, today])

  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined)

  const lifetimeActions = overviewQuery.data?.actionsRewarded ?? 0
  const lifetimeRewards = overviewQuery.data?.totalRewardAmount ?? 0
  const totalActionsLast7 = chartData.reduce((sum, d) => sum + d.actions, 0)

  const state: State = useMemo(() => {
    if (overviewQuery.isLoading || dailySummariesQuery.isLoading) return "loading"
    if (lifetimeActions === 0) return "first-time"
    if (totalActionsLast7 === 0) return "inactive"
    return "active"
  }, [overviewQuery.isLoading, dailySummariesQuery.isLoading, lifetimeActions, totalActionsLast7])

  const headerHint = useMemo(() => {
    if (state === "first-time") return t("No activity yet")
    return undefined
  }, [state, t])

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const day = today.subtract(6 - i, "day")
        const isToday = i === 6
        return { label: isToday ? t("Today") : day.format("ddd"), isToday }
      }),
    [today, t],
  )

  return (
    <VStack gap={3} align="stretch">
      <HStack justify="space-between" align="baseline">
        <Heading size="sm" fontWeight="semibold">
          {t("Last 7 days")}
        </Heading>
        {headerHint && (
          <Heading size="xs" fontWeight="normal" color="text.subtle">
            {headerHint}
          </Heading>
        )}
      </HStack>

      {state === "loading" && <Skeleton h="160px" w="full" borderRadius="lg" />}

      {state === "active" && (
        <LastSevenDaysChart data={chartData} onBarClick={bucket => setSelectedDate(bucket.date)} />
      )}

      {state === "first-time" && <LastSevenDaysFirstTime />}

      {state === "inactive" && (
        <LastSevenDaysInactive
          totalRewardsLabel={compact.format(lifetimeRewards)}
          weekDays={weekDays}
          onCtaClick={() => router.push("/apps")}
        />
      )}

      <ActivityDayModal
        address={address}
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(undefined)}
        date={selectedDate}
      />
    </VStack>
  )
}
