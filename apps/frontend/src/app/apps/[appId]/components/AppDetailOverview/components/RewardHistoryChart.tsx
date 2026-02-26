"use client"

import { Box, Center, HStack, NativeSelect, Skeleton, Text, useToken, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import type { AppEarnings } from "@/api/indexer/xallocations/useAppEarnings"

const compact = getCompactFormatter(1)

type ChartMetric = "allocations" | "rewards" | "actions" | "users"

type RoundOverview = {
  roundId: number
  totalRewardAmount?: number
  actionsRewarded?: number
  totalUniqueUserInteractions?: number
}

type ChartDataPoint = {
  round: number
  team: number
  rewards: number
  rewardsDistributed: number
  actions: number
  users: number
}

const METRIC_CONFIG: Record<ChartMetric, { colorKeys: string[]; unit: string }> = {
  allocations: { colorKeys: ["green.500", "green.300"], unit: "B3TR" },
  rewards: { colorKeys: ["purple.500"], unit: "B3TR" },
  actions: { colorKeys: ["orange.400"], unit: "" },
  users: { colorKeys: ["teal.400"], unit: "" },
}

const CustomTooltip = ({
  active,
  payload,
  label,
  metric,
}: {
  active?: boolean
  payload?: { value: number; dataKey: string; color: string; name: string }[]
  label?: number
  metric: ChartMetric
}) => {
  const { t } = useTranslation()
  const unit = METRIC_CONFIG[metric].unit

  if (!active || !payload?.length) return null

  return (
    <Box
      bg="white"
      _dark={{ bg: "gray.800" }}
      border="1px solid"
      borderColor="border"
      borderRadius="lg"
      p={3}
      boxShadow="lg">
      <Text textStyle="xs" fontWeight="semibold" mb={1}>
        {t("Round")}
        {" #"}
        {label}
      </Text>
      {metric === "allocations" ? (
        <Text textStyle="xs" color="text.subtle">
          {compact.format(payload.reduce((sum, e) => sum + e.value, 0))} {unit}
        </Text>
      ) : (
        payload.map(entry => (
          <Text key={entry.dataKey} textStyle="xs" color="text.subtle">
            {compact.format(entry.value)} {unit}
          </Text>
        ))
      )}
    </Box>
  )
}

export const RewardHistoryChart = ({
  earningsData,
  overviewData,
  isLoading,
}: {
  earningsData: AppEarnings | undefined
  overviewData: RoundOverview[] | undefined
  isLoading: boolean
}) => {
  const { t } = useTranslation()
  const [metric, setMetric] = useState<ChartMetric>("allocations")

  const allColorKeys = [...new Set(Object.values(METRIC_CONFIG).flatMap(c => c.colorKeys))]
  const tokenColors = useToken("colors", allColorKeys)
  const colorMap = Object.fromEntries(allColorKeys.map((key, i) => [key, tokenColors[i]]))

  const overviewRoundIds = useMemo(() => new Set(overviewData?.map(o => o.roundId)), [overviewData])

  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!earningsData || !Array.isArray(earningsData)) return []

    const overviewByRound = new Map(overviewData?.map(o => [o.roundId, o]))

    const allData = earningsData
      .sort((a, b) => a.roundId - b.roundId)
      .map(e => {
        const overview = overviewByRound.get(e.roundId)
        return {
          round: e.roundId,
          team: e.teamAllocationAmount || 0,
          rewards: e.rewardsAllocationAmount || 0,
          rewardsDistributed: overview?.totalRewardAmount ?? 0,
          actions: overview?.actionsRewarded ?? 0,
          users: overview?.totalUniqueUserInteractions ?? 0,
        }
      })

    if (metric === "allocations") return allData
    return allData.filter(d => overviewRoundIds.has(d.round))
  }, [earningsData, overviewData, metric, overviewRoundIds])

  const metricOptions: { value: ChartMetric; label: string }[] = [
    { value: "allocations", label: t("Allocation Earnings") },
    { value: "rewards", label: t("B3TR Distributed") },
    { value: "actions", label: t("Actions Rewarded") },
    { value: "users", label: t("Unique Users") },
  ]

  if (isLoading) {
    return <Skeleton w="full" h="260px" borderRadius="xl" />
  }

  if (!chartData.length) {
    return (
      <Center w="full" py={6}>
        <Text textStyle="sm" color="text.subtle">
          {t("No round data available yet")}
        </Text>
      </Center>
    )
  }

  return (
    <VStack w="full" align="stretch" gap={3}>
      <HStack justify="space-between" align="center">
        <NativeSelect.Root size="sm" w="auto" minW="180px">
          <NativeSelect.Field
            value={metric}
            onChange={e => setMetric(e.target.value as ChartMetric)}
            borderRadius="lg"
            textStyle="sm"
            fontWeight="semibold">
            {metricOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </HStack>

      <Box w="full" h="220px">
        <ResponsiveContainer width="100%" height="100%">
          {metric === "allocations" ? (
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRewards" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colorMap["green.500"]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colorMap["green.500"]} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradTeam" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colorMap["green.300"]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colorMap["green.300"]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="round"
                tick={{ fontSize: 11 }}
                tickFormatter={v => `#${v}`}
                stroke="#a0aec0"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={v => compact.format(v as number)}
                stroke="#a0aec0"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip metric={metric} />} />
              <Area
                type="monotone"
                dataKey="rewards"
                stackId="1"
                stroke={colorMap["green.500"]}
                fill="url(#gradRewards)"
                strokeWidth={2}
                name={t("Rewards")}
              />
              <Area
                type="monotone"
                dataKey="team"
                stackId="1"
                stroke={colorMap["green.300"]}
                fill="url(#gradTeam)"
                strokeWidth={2}
                name={t("Team")}
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="round"
                tick={{ fontSize: 11 }}
                tickFormatter={v => `#${v}`}
                stroke="#a0aec0"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={v => compact.format(v as number)}
                stroke="#a0aec0"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip metric={metric} />} />
              <Bar
                dataKey={metric === "rewards" ? "rewardsDistributed" : metric}
                fill={colorMap[METRIC_CONFIG[metric].colorKeys[0] ?? "blue.500"]}
                radius={[4, 4, 0, 0]}
                name={metricOptions.find(o => o.value === metric)?.label ?? ""}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </Box>
    </VStack>
  )
}
