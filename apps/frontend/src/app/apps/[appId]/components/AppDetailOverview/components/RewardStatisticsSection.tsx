import { Center, Heading, SimpleGrid, Skeleton, Text, VStack } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useAppActionOverview } from "@/api/indexer/actions/useAppActionOverview"
import { useAppRoundOverviews } from "@/api/indexer/actions/useAppRoundOverviews"
import { useAppEarnings } from "@/api/indexer/xallocations/useAppEarnings"

import { useCurrentAppInfo } from "../../../hooks/useCurrentAppInfo"

import { RewardHistoryChart } from "./RewardHistoryChart"

const compact = getCompactFormatter(2)

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <VStack align="flex-start" gap={1}>
    <Text textStyle="sm" color="text.subtle">
      {label}
    </Text>
    <Heading size="md" color="brand.primary">
      {value}
    </Heading>
  </VStack>
)

const StatsSkeleton = ({ count }: { count: number }) => (
  <SimpleGrid columns={[1, 2, 3]} gap={4} w="full">
    {Array.from({ length: count }).map((_, i) => (
      <VStack key={i} align="flex-start" gap={1}>
        <Skeleton w="40%" h="16px" />
        <Skeleton w="60%" h="32px" />
      </VStack>
    ))}
  </SimpleGrid>
)

export const RewardStatisticsSection = () => {
  const { t } = useTranslation()
  const { app } = useCurrentAppInfo()
  const appId = app?.id ?? ""

  const { data: allTimeOverview, isLoading: allTimeLoading } = useAppActionOverview(appId)
  const { data: earningsData, isLoading: earningsLoading } = useAppEarnings(appId)

  const roundIds = useMemo(
    () => (earningsData && Array.isArray(earningsData) ? earningsData.map(e => e.roundId) : []),
    [earningsData],
  )
  const { data: overviewData, isLoading: overviewLoading } = useAppRoundOverviews(appId, roundIds)

  const allTimeStats = useMemo(() => {
    if (!allTimeOverview) return null
    return {
      totalRewards: FormattingUtils.humanNumber(allTimeOverview.totalRewardAmount ?? 0),
      actionsRewarded: FormattingUtils.humanNumber(allTimeOverview.actionsRewarded ?? 0),
      uniqueUsers: FormattingUtils.humanNumber(allTimeOverview.totalUniqueUserInteractions ?? 0),
    }
  }, [allTimeOverview])

  const allocationTotal = useMemo(() => {
    if (!earningsData || !Array.isArray(earningsData)) return 0
    return earningsData.reduce((sum, earning) => sum + (earning.totalAmount || 0), 0)
  }, [earningsData])

  const isChartLoading = earningsLoading || (roundIds.length > 0 && overviewLoading)

  return (
    <VStack gap={6} align="stretch" w="full">
      <Heading size="lg">{t("All Time")}</Heading>
      {allTimeLoading ? (
        <StatsSkeleton count={4} />
      ) : allTimeStats ? (
        <SimpleGrid columns={[2, 2, 4]} gap={4} w="full">
          <StatItem label={t("B3TR from Allocations")} value={compact.format(allocationTotal)} />
          <StatItem label={t("B3TR Distributed")} value={allTimeStats.totalRewards} />
          <StatItem label={t("Actions Rewarded")} value={allTimeStats.actionsRewarded} />
          <StatItem label={t("Unique Users")} value={allTimeStats.uniqueUsers} />
        </SimpleGrid>
      ) : (
        <Center w="full" py={4}>
          <Text textStyle="sm" color="text.subtle">
            {t("No statistics available")}
          </Text>
        </Center>
      )}

      <Heading size="lg">{t("Round History")}</Heading>
      <RewardHistoryChart earningsData={earningsData} overviewData={overviewData} isLoading={isChartLoading} />
    </VStack>
  )
}
