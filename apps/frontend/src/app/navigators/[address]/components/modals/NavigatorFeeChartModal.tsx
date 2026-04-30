"use client"

import { Box, Center, HStack, SegmentGroup, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuChartBar } from "react-icons/lu"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { useNavigatorFeeHistory } from "@/api/indexer/navigators/useNavigatorFeeHistory"
import { BaseModal } from "@/components/BaseModal"

const compact = getCompactFormatter(1)

type Period = "3M" | "6M" | "1Y" | "All"

const PERIOD_ROUND_LIMITS: Record<Period, number | null> = {
  "3M": 13,
  "6M": 26,
  "1Y": 52,
  All: null,
}

type ChartDataPoint = {
  round: number
  earned: number
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: number
}) => {
  const { t } = useTranslation()

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
      <Text textStyle="xs" color="text.subtle">
        {compact.format(payload[0]?.value ?? 0)} {"B3TR"}
      </Text>
    </Box>
  )
}

type Props = {
  address: string
  isOpen: boolean
  onClose: () => void
}

export const NavigatorFeeChartModal = ({ address, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<Period>("3M")

  const { data, isLoading } = useNavigatorFeeHistory(address, 200)

  const chartData = useMemo<ChartDataPoint[]>(() => {
    const entries = data?.pages.flat() ?? []
    if (!entries.length) return []

    const sorted = [...entries].sort((a, b) => Number(a.roundId) - Number(b.roundId))
    const mapped = sorted.map(e => ({
      round: Number(e.roundId),
      earned: e.totalDepositedFormatted,
    }))

    const limit = PERIOD_ROUND_LIMITS[period]
    if (limit == null) return mapped
    return mapped.slice(-limit)
  }, [data, period])

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} ariaTitle={t("Fee Earnings")} showCloseButton>
      <VStack gap={4} align="stretch" py={4} px={2}>
        <HStack gap={2}>
          <LuChartBar size={18} />
          <Text textStyle="lg" fontWeight="semibold">
            {t("Fee Earnings")}
          </Text>
        </HStack>

        <SegmentGroup.Root
          w="full"
          size="sm"
          borderRadius="lg"
          value={period}
          onValueChange={e => setPeriod(e.value as Period)}>
          <SegmentGroup.Indicator borderRadius="lg" />
          {(["3M", "6M", "1Y", "All"] as Period[]).map(item => (
            <SegmentGroup.Item key={item} value={item} flex="1">
              <SegmentGroup.ItemText>{item}</SegmentGroup.ItemText>
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
          ))}
        </SegmentGroup.Root>

        {isLoading ? (
          <Skeleton w="full" h="220px" borderRadius="xl" />
        ) : !chartData.length ? (
          <Center py={6}>
            <Text textStyle="sm" color="text.subtle">
              {t("No fee data available yet")}
            </Text>
          </Center>
        ) : (
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
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="earned" fill="#38A169" radius={[4, 4, 0, 0]} name={t("Earned")} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </VStack>
    </BaseModal>
  )
}
