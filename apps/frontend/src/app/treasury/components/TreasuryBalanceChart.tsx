"use client"

import { Box, Card, Center, Heading, HStack, SegmentGroup, Skeleton, Text, useToken, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { BalancePeriod, useTreasuryBalanceHistory } from "../../../api/contracts/treasury/useTreasuryBalanceHistory"

const compact = getCompactFormatter(1)

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) => {
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
        {label}
      </Text>
      <Text textStyle="xs" color="text.subtle">
        {compact.format(payload[0]?.value ?? 0)} {"B3TR"}
      </Text>
    </Box>
  )
}

export const TreasuryBalanceChart = () => {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<BalancePeriod>("3M")
  const { chartData, isLoading, isFetching } = useTreasuryBalanceHistory(period)

  const [purpleColor] = useToken("colors", ["purple.500"])

  const displayData = useMemo(() => {
    if (!chartData.length) return []
    const step = Math.max(1, Math.floor(chartData.length / 50))
    return chartData.filter((_, i) => i % step === 0 || i === chartData.length - 1)
  }, [chartData])

  if (isLoading || isFetching) {
    return (
      <Card.Root w="full">
        <Card.Body>
          <Skeleton w="full" h="340px" borderRadius="xl" />
        </Card.Body>
      </Card.Root>
    )
  }

  if (!displayData.length) {
    return (
      <Card.Root w="full">
        <Card.Body>
          <Center w="full" py={6}>
            <Text textStyle="sm" color="text.subtle">
              {t("No balance data available")}
            </Text>
          </Center>
        </Card.Body>
      </Card.Root>
    )
  }

  return (
    <Card.Root w="full">
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between" align="start" flexWrap="wrap" gap={3}>
            <VStack align="start" gap={0}>
              <Heading size="lg" fontWeight="bold">
                {t("Treasury Balance")}
              </Heading>
              <Text textStyle="sm" color="text.muted">
                {t("B3TR balance over time")}
              </Text>
            </VStack>
            <SegmentGroup.Root size="sm" value={period} onValueChange={e => setPeriod(e.value as BalancePeriod)}>
              <SegmentGroup.Indicator />
              <SegmentGroup.Items items={["1M", "3M", "1Y", "All"]} />
            </SegmentGroup.Root>
          </HStack>

          <Box w="full" h="260px">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradB3tr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={purpleColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={purpleColor} stopOpacity={0} />
                  </linearGradient>
                </defs>

                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#a0aec0" axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={v => compact.format(v as number)}
                  stroke="#a0aec0"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  isAnimationActive={false}
                  dataKey="b3tr"
                  fill="url(#gradB3tr)"
                  stroke={purpleColor}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
