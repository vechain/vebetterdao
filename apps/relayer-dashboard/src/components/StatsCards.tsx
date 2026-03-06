"use client"

import { Card, SimpleGrid, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useGetTokenUsdPrice } from "@vechain/vechain-kit"

import { useCurrentRoundId } from "@/hooks/useCurrentRoundId"
import { useRegisteredRelayers } from "@/hooks/useRegisteredRelayers"
import { useReportData } from "@/hooks/useReportData"
import { useRoundRewardStatus } from "@/hooks/useRoundRewardStatus"
import { useTotalAutoVotingUsers } from "@/hooks/useTotalAutoVotingUsers"

function parseROI(
  rounds: { totalRelayerRewards: string; vthoSpentTotal: string }[],
  b3trToVtho: number | undefined,
): number | null {
  if (rounds.length === 0 || b3trToVtho == null || b3trToVtho <= 0) return null
  let totalRewardB3TR = 0
  let totalVtho = 0
  for (const r of rounds) {
    const b3trMatch = r.totalRelayerRewards.match(/^([\d.]+)/)
    const vthoMatch = r.vthoSpentTotal.match(/^([\d.]+)/)
    if (b3trMatch) totalRewardB3TR += Number(b3trMatch[1])
    if (vthoMatch) totalVtho += Number(vthoMatch[1])
  }
  if (totalVtho === 0) return null
  const rewardAsVtho = totalRewardB3TR * b3trToVtho
  return (rewardAsVtho / totalVtho) * 100
}

/** B3TR to VTHO rate from VeChain oracle (1 B3TR = X VTHO). */
function useB3trToVthoRate() {
  const { data: b3trUsd } = useGetTokenUsdPrice("B3TR")
  const { data: vthoUsd } = useGetTokenUsdPrice("VTHO")
  if (b3trUsd == null || vthoUsd == null || vthoUsd <= 0) return undefined
  return b3trUsd / vthoUsd
}

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
  const roi = parseROI(rounds, b3trToVtho)

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
