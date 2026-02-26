import { Center, Heading, SimpleGrid, Skeleton, Text, VStack } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useAppAvailableFunds } from "@/api/contracts/x2EarnRewardsPool/hooks/getter/useAppAvailableFunds"
import { useAppRewardsBalance } from "@/api/contracts/x2EarnRewardsPool/hooks/getter/useAppRewardsBalance"
import { useAppActionOverview } from "@/api/indexer/actions/useAppActionOverview"
import { useAppEarnings } from "@/api/indexer/xallocations/useAppEarnings"

import { useCurrentAppInfo } from "../../../hooks/useCurrentAppInfo"

const compact = getCompactFormatter(2)

const StatItem = ({ label, value, postfix }: { label: string; value: string; postfix?: string }) => (
  <VStack align="flex-start" gap={1}>
    <Text textStyle="sm" color="text.subtle">
      {label}
    </Text>
    <Heading size="md" color="brand.primary" display="flex" gap={1}>
      {value}
      {postfix && (
        <Text textStyle="md" color="text.subtle">
          {postfix}
        </Text>
      )}
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
  const { data: earningsData } = useAppEarnings(appId)
  const { data: availableFunds, isLoading: isAvailableFundsLoading } = useAppAvailableFunds(appId)
  const { data: rewardsBalance, isLoading: isRewardsBalanceLoading } = useAppRewardsBalance(appId)

  const totalAppBalance = useMemo(() => {
    return Number(availableFunds?.scaled ?? 0) + Number(rewardsBalance?.scaled ?? 0)
  }, [availableFunds, rewardsBalance])

  const isBalanceLoading = isAvailableFundsLoading || isRewardsBalanceLoading

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

  return (
    <VStack gap={6} align="stretch" w="full">
      {allTimeLoading && isBalanceLoading ? (
        <StatsSkeleton count={5} />
      ) : allTimeStats ? (
        <SimpleGrid columns={[2, 3, 3]} gap={4} w="full">
          <StatItem label={t("Balance")} value={compact.format(totalAppBalance)} postfix={t("B3TR")} />
          <StatItem
            label={t("Received from allocations")}
            value={compact.format(allocationTotal)}
            postfix={t("B3TR")}
          />
          <StatItem label={t("Distributed")} value={allTimeStats.totalRewards} postfix={t("B3TR")} />
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
    </VStack>
  )
}
