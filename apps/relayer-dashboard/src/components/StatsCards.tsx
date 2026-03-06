"use client"

import { Card, SimpleGrid, Skeleton, Text, VStack } from "@chakra-ui/react"

import { useB3trToVthoRate } from "@/hooks/useB3trToVthoRate"
import { useRegisteredRelayers } from "@/hooks/useRegisteredRelayers"
import { useReportData } from "@/hooks/useReportData"
import { useTotalAutoVotingUsers } from "@/hooks/useTotalAutoVotingUsers"
import { formatNumber, formatToken } from "@/lib/format"
import { computeAverageROI } from "@/lib/roi"

interface StatItemProps {
  label: string
  value: string
  sublabel: string
  isLoading?: boolean
}

function StatItem({ label, value, sublabel, isLoading }: StatItemProps) {
  return (
    <Card.Root
      p={{ base: "4", md: "6" }}
      variant="action"
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

function computeTotalRewardsRaw(rounds: { totalRelayerRewardsRaw: string }[]): string {
  let total = BigInt(0)
  for (const r of rounds) {
    total += BigInt(r.totalRelayerRewardsRaw)
  }
  return total.toString()
}

export function StatsCards() {
  const { data: report, isLoading, error } = useReportData()
  const { totalUsers: onChainUsers, isLoading: usersLoading } = useTotalAutoVotingUsers()
  const { count: relayerCount, isLoading: relayersLoading } = useRegisteredRelayers()
  const b3trToVtho = useB3trToVthoRate()

  if (error) {
    return (
      <Text color="status.negative.primary" textStyle="sm">
        {"Failed to load report data."}
      </Text>
    )
  }

  const rounds = report?.rounds ?? []
  const concludedRounds = rounds.filter(r => r.isRoundEnded && r.totalRelayerRewardsRaw !== "0")
  const roi = computeAverageROI(concludedRounds, b3trToVtho)
  const totalRewards = computeTotalRewardsRaw(rounds)

  const roiSublabel =
    b3trToVtho != null ? `1 B3TR = ${formatNumber(Math.round(b3trToVtho))} VTHO` : "1 B3TR = \u2026 VTHO"

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="4">
      <StatItem
        label="Auto-voting users"
        value={usersLoading ? "..." : onChainUsers != null ? formatNumber(onChainUsers) : "\u2014"}
        sublabel="current total"
        isLoading={usersLoading}
      />
      <StatItem
        label="Registered relayers"
        value={relayersLoading ? "..." : String(relayerCount)}
        sublabel="on-chain"
        isLoading={relayersLoading}
      />
      <StatItem
        label="Total rewards"
        value={isLoading ? "..." : `${formatToken(totalRewards)} B3TR`}
        sublabel="all rounds"
        isLoading={isLoading}
      />
      <StatItem
        label="Average ROI"
        value={isLoading ? "..." : roi != null ? `${formatNumber(Math.round(roi))}%` : "\u2014"}
        sublabel={roiSublabel}
        isLoading={isLoading}
      />
    </SimpleGrid>
  )
}
