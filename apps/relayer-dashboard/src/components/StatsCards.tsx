"use client"

import { Card, SimpleGrid, Skeleton, Text, VStack } from "@chakra-ui/react"

import { useB3trToVthoRate } from "@/hooks/useB3trToVthoRate"
import { useCurrentRoundId } from "@/hooks/useCurrentRoundId"
import { useRegisteredRelayers } from "@/hooks/useRegisteredRelayers"
import { useReportData } from "@/hooks/useReportData"
import { useRoundRewardStatus } from "@/hooks/useRoundRewardStatus"
import { useTotalAutoVotingUsers } from "@/hooks/useTotalAutoVotingUsers"
import { computeAggregateROI } from "@/lib/roi"

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

export function StatsCards() {
  const { data: report, isLoading, error } = useReportData()
  const { totalUsers: onChainUsers, isLoading: usersLoading } = useTotalAutoVotingUsers()
  const { count: relayerCount, isLoading: relayersLoading } = useRegisteredRelayers()
  const { data: currentRoundId } = useCurrentRoundId()
  const previousRoundReward = useRoundRewardStatus(currentRoundId != null ? currentRoundId - 1 : undefined)
  const b3trToVtho = useB3trToVthoRate()

  if (error) {
    return (
      <Text color="status.negative.primary" textStyle="sm">
        {"Failed to load report data."}
      </Text>
    )
  }

  const rounds = report?.rounds ?? []
  const roi = computeAggregateROI(rounds, b3trToVtho)

  const roiSublabel = b3trToVtho != null ? `1 B3TR = ${Math.round(b3trToVtho)} VTHO` : "1 B3TR = … VTHO"

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="4">
      <StatItem
        label="Auto-voting users"
        value={usersLoading ? "..." : onChainUsers != null ? onChainUsers.toLocaleString() : "\u2014"}
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
        label="Reward pool"
        value={previousRoundReward.totalRewardsFormatted ?? "\u2014"}
        sublabel={"Previous round"}
        isLoading={previousRoundReward.isLoading}
      />
      <StatItem
        label="Average ROI"
        value={isLoading ? "..." : roi != null ? `${Math.round(roi)}%` : "\u2014"}
        sublabel={roiSublabel}
        isLoading={isLoading}
      />
    </SimpleGrid>
  )
}
