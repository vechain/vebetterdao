"use client"

import { Badge, Box, Heading, HStack, Skeleton, Text, useToken, VStack } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { getCompactFormatter, humanAddress } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { ChallengeDetail, ChallengeStatus, SettlementMode } from "@/api/challenges/types"
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
  const { account } = useWallet()
  const viewerAddress = account?.address
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
  const leaderboard = data?.leaderboard ?? []

  const chartData = useMemo<ChartEntry[]>(() => {
    const bestScore = leaderboard[0]?.actions ?? 0

    return leaderboard.map(entry => ({
      participant: entry.participant,
      label: humanAddress(entry.participant, 6, 4),
      actions: entry.actions,
      fill: leaderboard.length > 0 && entry.actions === bestScore ? leaderColor : trailingColor,
    }))
  }, [leaderColor, leaderboard, trailingColor])

  const outcome = useMemo(() => {
    if (challenge.status !== ChallengeStatus.Finalized) return null

    if (challenge.settlementMode === SettlementMode.CreatorRefund) {
      return {
        kind: "payout" as const,
        addresses: [challenge.creator],
        isViewerWinner: false,
      }
    }

    const addresses =
      challenge.settlementMode === SettlementMode.QualifiedSplit
        ? leaderboard.filter(entry => entry.actions >= Number(challenge.threshold)).map(entry => entry.participant)
        : (() => {
            const bestScore = leaderboard[0]?.actions
            return typeof bestScore === "number"
              ? leaderboard.filter(entry => entry.actions === bestScore).map(entry => entry.participant)
              : []
          })()

    return {
      kind: "winner" as const,
      addresses,
      isViewerWinner: !!viewerAddress && addresses.some(address => compareAddresses(address, viewerAddress)),
    }
  }, [challenge.creator, challenge.settlementMode, challenge.status, challenge.threshold, leaderboard, viewerAddress])

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

      {outcome && outcome.addresses.length > 0 && (
        <VStack align="stretch" gap="2">
          <Text textStyle="sm" color="text.subtle">
            {t("Challenge outcome")}
          </Text>
          {outcome.kind === "winner" && viewerAddress && (
            <Text textStyle="sm" fontWeight="semibold">
              {t(outcome.isViewerWinner ? "You won this challenge" : "You did not win this challenge")}
            </Text>
          )}
          {outcome.kind === "payout" && (
            <Text textStyle="sm" fontWeight="semibold">
              {t("No participant won this challenge")}
            </Text>
          )}
          <VStack align="start" gap="1">
            <Text textStyle="xs" color="text.subtle">
              {t(
                outcome.kind === "payout"
                  ? outcome.addresses.length === 1
                    ? "Payout recipient"
                    : "Payout recipients"
                  : outcome.addresses.length === 1
                    ? "Winner"
                    : "Winners",
              )}
            </Text>
            <HStack flexWrap="wrap" gap="2">
              {outcome.addresses.map(address => (
                <Badge key={address} variant="subtle" rounded="sm">
                  {humanAddress(address, 6, 4)}
                </Badge>
              ))}
            </HStack>
          </VStack>
        </VStack>
      )}

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
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 12, left: 24, bottom: 0 }}>
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
                width={112}
                tick={{ fontSize: 11 }}
                tickMargin={8}
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
