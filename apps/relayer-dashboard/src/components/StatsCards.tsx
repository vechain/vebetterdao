"use client"

import { Card, SimpleGrid, Skeleton, Text, VStack } from "@chakra-ui/react"

import { useReportData } from "@/hooks/useReportData"

function computeStats(rounds: { autoVotingUsersCount: number; numRelayers: number }[]) {
  const totalUsers = rounds.reduce((sum, r) => sum + r.autoVotingUsersCount, 0)
  const maxRelayers = rounds.length > 0 ? Math.max(...rounds.map(r => r.numRelayers)) : 0
  return { totalUsers, maxRelayers, roundCount: rounds.length }
}

function parseROI(rounds: { totalRelayerRewards: string; vthoSpentTotal: string }[]): number | null {
  if (rounds.length === 0) return null
  const B3TR_TO_VTHO = 19
  let totalRewardB3TR = 0
  let totalVtho = 0
  for (const r of rounds) {
    const b3trMatch = r.totalRelayerRewards.match(/^([\d.]+)/)
    const vthoMatch = r.vthoSpentTotal.match(/^([\d.]+)/)
    if (b3trMatch) totalRewardB3TR += Number(b3trMatch[1])
    if (vthoMatch) totalVtho += Number(vthoMatch[1])
  }
  if (totalVtho === 0) return null
  const rewardAsVtho = totalRewardB3TR * B3TR_TO_VTHO
  return (rewardAsVtho / totalVtho) * 100
}

interface StatItemProps {
  variant: "info" | "positive" | "warning"
  label: string
  value: string
  sublabel: string
  isLoading?: boolean
}

function StatItem({ variant, label, value, sublabel, isLoading }: StatItemProps) {
  return (
    <Card.Root
      p={{ base: "4", md: "6" }}
      variant="subtle"
      border="sm"
      borderColor="border.secondary"
      bgColor={`status.${variant}.subtle`}
      flexDirection="row"
      alignItems="center"
      gap={{ base: "2", md: "4" }}>
      <VStack flex={1} alignItems="start" gap="1">
        <Text textStyle={{ base: "xs", md: "md" }} color="text.subtle" lineClamp={1}>
          {label}
        </Text>
        <Skeleton loading={!!isLoading}>
          <Text textStyle={{ base: "lg", md: "2xl" }} fontWeight="semibold">
            {value}
          </Text>
        </Skeleton>
        <Text textStyle="xs" color="text.subtle">
          {sublabel}
        </Text>
      </VStack>
    </Card.Root>
  )
}

export function StatsCards() {
  const { data: report, isLoading, error } = useReportData()

  if (error) {
    return (
      <Text color="status.negative.primary" textStyle="sm">
        {"Failed to load report data."}
      </Text>
    )
  }

  const rounds = report?.rounds ?? []
  const { totalUsers, maxRelayers, roundCount } = computeStats(rounds)
  const roi = parseROI(rounds)

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
      <StatItem
        variant="info"
        label="Total users (auto-voting)"
        value={isLoading ? "..." : totalUsers.toLocaleString()}
        sublabel={`across ${roundCount} rounds`}
        isLoading={isLoading}
      />
      <StatItem
        variant="positive"
        label="Relayers"
        value={isLoading ? "..." : String(maxRelayers)}
        sublabel="max in a round"
        isLoading={isLoading}
      />
      <StatItem
        variant="warning"
        label="Avg ROI"
        value={isLoading ? "..." : roi != null ? `${Math.round(roi)}%` : "\u2014"}
        sublabel="1 B3TR = 19 VTHO"
        isLoading={isLoading}
      />
    </SimpleGrid>
  )
}
