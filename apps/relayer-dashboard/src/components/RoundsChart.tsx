"use client"

import {
  Box,
  Card,
  Center,
  HStack,
  NativeSelect,
  SegmentGroup,
  Skeleton,
  Text,
  useToken,
  VStack,
} from "@chakra-ui/react"
import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatEther } from "viem"

import { useReportData } from "@/hooks/useReportData"

type ChartMetric = "vthoSpent" | "rewards" | "users"
type Period = "3M" | "6M" | "1Y" | "All"

const PERIOD_ROUND_LIMITS: Record<Period, number | null> = {
  "3M": 13,
  "6M": 26,
  "1Y": 52,
  All: null,
}

const METRIC_CONFIG: Record<ChartMetric, { label: string; colorKey: string; unit: string }> = {
  vthoSpent: { label: "VTHO Spent", colorKey: "blue.400", unit: "VTHO" },
  rewards: { label: "B3TR Rewards", colorKey: "green.400", unit: "B3TR" },
  users: { label: "Auto-voting Users", colorKey: "purple.400", unit: "" },
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })

function CustomTooltip({
  active,
  payload,
  label,
  metric,
}: {
  active?: boolean
  payload?: { value: number; color: string }[]
  label?: number
  metric: ChartMetric
}) {
  const unit = METRIC_CONFIG[metric].unit
  if (!active || !payload?.length) return null

  return (
    <Box bg="bg.primary" border="1px solid" borderColor="border.secondary" borderRadius="lg" p={3} boxShadow="lg">
      <Text textStyle="xs" fontWeight="semibold" mb={1}>
        {"Round #"}
        {label}
      </Text>
      <Text textStyle="xs" color="text.subtle">
        {compact.format(payload[0]?.value ?? 0)}
        {unit ? ` ${unit}` : ""}
      </Text>
    </Box>
  )
}

export function RoundsChart() {
  const { data: report, isLoading } = useReportData()
  const [metric, setMetric] = useState<ChartMetric>("rewards")
  const [period, setPeriod] = useState<Period>("3M")

  const allColorKeys = Object.values(METRIC_CONFIG).map(c => c.colorKey)
  const tokenColors = useToken("colors", allColorKeys)
  const colorMap = Object.fromEntries(allColorKeys.map((key, i) => [key, tokenColors[i]]))

  const chartData = useMemo(() => {
    if (!report?.rounds) return []

    const sorted = [...report.rounds].sort((a, b) => a.roundId - b.roundId)

    const mapped = sorted.map(r => ({
      round: r.roundId,
      vthoSpent: Number(formatEther(BigInt(r.vthoSpentTotalRaw))),
      rewards: Number(formatEther(BigInt(r.totalRelayerRewardsRaw))),
      users: r.autoVotingUsersCount,
    }))

    const limit = PERIOD_ROUND_LIMITS[period]
    if (limit == null) return mapped
    return mapped.slice(-limit)
  }, [report, period])

  if (isLoading) {
    return <Skeleton w="full" h="340px" borderRadius="xl" />
  }

  if (!chartData.length) {
    return (
      <Center w="full" py={6}>
        <Text textStyle="sm" color="text.subtle">
          {"No round data available yet"}
        </Text>
      </Center>
    )
  }

  const metricOptions = Object.entries(METRIC_CONFIG).map(([value, cfg]) => ({
    value: value as ChartMetric,
    label: cfg.label,
  }))

  return (
    <Card.Root variant="primary" w="full">
      <Card.Body>
        <VStack w="full" align="stretch" gap={3}>
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
            <NativeSelect.Root size="sm" w="auto" minW={{ base: "full", md: "180px" }}>
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

            <SegmentGroup.Root
              w={{ base: "full", md: "auto" }}
              size="sm"
              borderRadius="lg"
              value={period}
              onValueChange={e => setPeriod(e.value as Period)}>
              <SegmentGroup.Indicator borderRadius="lg" />
              {(["3M", "6M", "1Y", "All"] as const).map(item => (
                <SegmentGroup.Item key={item} value={item} flex={{ base: "1", md: "initial" }}>
                  <SegmentGroup.ItemText>{item}</SegmentGroup.ItemText>
                  <SegmentGroup.ItemHiddenInput />
                </SegmentGroup.Item>
              ))}
            </SegmentGroup.Root>
          </HStack>

          <Box w="full" h="220px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
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
                <Bar dataKey={metric} fill={colorMap[METRIC_CONFIG[metric].colorKey]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
