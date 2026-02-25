import { Center, Heading, SimpleGrid, Skeleton, Text, VStack } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { usePreviousAllocationRoundId } from "@/api/contracts/xAllocations/hooks/usePreviousAllocationRoundId"
import { useAppActionOverview } from "@/api/indexer/actions/useAppActionOverview"
import { useAppEarnings } from "@/api/indexer/xallocations/useAppEarnings"

import { useCurrentAppInfo } from "../../../hooks/useCurrentAppInfo"

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

  const { data: previousRoundId } = usePreviousAllocationRoundId()

  // All-time overview
  const { data: allTimeOverview, isLoading: allTimeLoading } = useAppActionOverview(appId)

  // Previous round overview
  const { data: prevRoundOverview, isLoading: prevRoundLoading } = useAppActionOverview(
    appId,
    { roundId: previousRoundId ? Number(previousRoundId) : undefined },
    !!previousRoundId,
  )

  // Allocation earnings (all rounds)
  const { data: earningsData } = useAppEarnings(appId)

  const allTimeStats = useMemo(() => {
    if (!allTimeOverview) return null
    return {
      totalRewards: FormattingUtils.humanNumber(allTimeOverview.totalRewardAmount ?? 0),
      actionsRewarded: FormattingUtils.humanNumber(allTimeOverview.actionsRewarded ?? 0),
      uniqueUsers: FormattingUtils.humanNumber(allTimeOverview.totalUniqueUserInteractions ?? 0),
    }
  }, [allTimeOverview])

  const allocationStats = useMemo(() => {
    if (!earningsData || !Array.isArray(earningsData)) {
      return { total: 0, lastRound: 0 }
    }
    const total = earningsData.reduce((sum, earning) => sum + (earning.totalAmount || 0), 0)
    const lastRound = earningsData[earningsData.length - 1]?.totalAmount || 0
    return { total, lastRound }
  }, [earningsData])

  const prevRoundStats = useMemo(() => {
    if (!prevRoundOverview) return null
    return {
      rewardsDistributed: FormattingUtils.humanNumber(prevRoundOverview.totalRewardAmount ?? 0),
      actions: FormattingUtils.humanNumber(prevRoundOverview.actionsRewarded ?? 0),
      uniqueUsers: FormattingUtils.humanNumber(prevRoundOverview.totalUniqueUserInteractions ?? 0),
    }
  }, [prevRoundOverview])

  const isPrevRoundLoading = prevRoundLoading

  return (
    <VStack gap={4} align="stretch" w="full">
      {/* All Time Stats */}
      <Heading size="lg">{t("All Time")}</Heading>
      {allTimeLoading ? (
        <StatsSkeleton count={5} />
      ) : allTimeStats ? (
        <SimpleGrid columns={[2, 2, 4]} gap={4} w="full">
          <StatItem label={t("B3TR from Allocations")} value={compact.format(allocationStats.total)} />
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

      {/* Previous Round Stats */}
      <Heading size="lg">
        {t("Previous Round")} {previousRoundId && `(#${previousRoundId})`}
      </Heading>
      {isPrevRoundLoading ? (
        <StatsSkeleton count={6} />
      ) : prevRoundStats ? (
        <SimpleGrid columns={[2, 2, 4]} gap={4} w="full">
          <StatItem label={t("B3TR from Allocations")} value={compact.format(allocationStats.lastRound)} />
          <StatItem label={t("B3TR Distributed")} value={prevRoundStats.rewardsDistributed} />
          <StatItem label={t("Actions Rewarded")} value={prevRoundStats.actions} />
          <StatItem label={t("Unique Users")} value={prevRoundStats.uniqueUsers} />
        </SimpleGrid>
      ) : (
        <Center w="full" py={4}>
          <Text textStyle="sm" color="text.subtle">
            {t("No statistics available")}
          </Text>
        </Center>
      )}
    </VStack>
  )
}
