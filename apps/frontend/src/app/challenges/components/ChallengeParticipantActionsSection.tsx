"use client"

import { Box, Heading, Skeleton, Text, useToken, VStack } from "@chakra-ui/react"
import { getCompactFormatter, humanAddress } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { ChallengeDetail } from "@/api/challenges/types"
import { useChallengeParticipantActions } from "@/api/challenges/useChallengeParticipantActions"

const compactFormatter = getCompactFormatter(1)

type ChartEntry = {
  participant: string
  label: string
  actions: number
  fill: string
}

const ChartTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: ChartEntry }[] }) => {
  const { t } = useTranslation()

  if (!active || !payload?.length) return null

  const entry = payload[0]?.payload
  if (!entry) return null

  return (
    <Box
      bg="white"
      _dark={{ bg: "gray.800" }}
      border="1px solid"
      borderColor="border.secondary"
      borderRadius="lg"
      p={3}
      boxShadow="lg">
      <Text textStyle="xs" fontWeight="semibold" mb={1}>
        {entry.participant}
      </Text>
      <Text textStyle="xs" color="text.subtle">
        {compactFormatter.format(entry.actions)} {t("Actions Rewarded")}
      </Text>
    </Box>
  )
}

export const ChallengeParticipantActionsSection = ({ challenge }: { challenge: ChallengeDetail }) => {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useChallengeParticipantActions(challenge.challengeId, challenge.participants)
  const [leaderColorToken, trailingColorToken, gridColorToken, axisColorToken] = useToken("colors", [
    "blue.600",
    "blue.200",
    "gray.200",
    "gray.400",
  ])
  const leaderColor = leaderColorToken ?? "#004CFC"
  const trailingColor = trailingColorToken ?? "#B3CCFF"
  const gridColor = gridColorToken ?? "#E7E9EB"
  const axisColor = axisColorToken ?? "#AAAFB6"

  const chartData = useMemo<ChartEntry[]>(() => {
    const leaderboard = data?.leaderboard ?? []
    const bestScore = leaderboard[0]?.actions ?? 0

    return leaderboard.map(entry => ({
      participant: entry.participant,
      label: humanAddress(entry.participant, 6, 4),
      actions: entry.actions,
      fill: bestScore > 0 && entry.actions === bestScore ? leaderColor : trailingColor,
    }))
  }, [data?.leaderboard, leaderColor, trailingColor])

  const chartHeight = Math.max(220, chartData.length * 44)

  return (
    <VStack align="stretch" gap="4">
      <VStack align="start" gap="0">
        <Text textStyle="sm" color="text.subtle">
          {t("Participants")}
        </Text>
        <Heading size="xl">{compactFormatter.format(data?.totalActions ?? 0)}</Heading>
        <Text textStyle="xs" color="text.subtle">
          {t("total actions")}
        </Text>
      </VStack>

      {isLoading ? (
        <Skeleton h="260px" borderRadius="xl" />
      ) : isError ? (
        <Text textStyle="sm" color="text.subtle">
          {t("No round data available yet")}
        </Text>
      ) : !chartData.length ? (
        <Text textStyle="sm" color="text.subtle">
          {t("None yet")}
        </Text>
      ) : (
        <Box w="full" h={`${chartHeight}px`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 12, left: 12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickFormatter={value => compactFormatter.format(value as number)}
                stroke={axisColor}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={96}
                tick={{ fontSize: 11 }}
                stroke={axisColor}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={false} />
              <Bar dataKey="actions" radius={[0, 6, 6, 0]} minPointSize={4}>
                {chartData.map(entry => (
                  <Cell key={entry.participant} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </VStack>
  )
}
