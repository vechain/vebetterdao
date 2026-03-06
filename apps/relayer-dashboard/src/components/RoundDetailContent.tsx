"use client"

import { Card, Grid, HStack, Icon, Progress, Separator, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { useGetTokenUsdPrice } from "@vechain/vechain-kit"
import type { ReactNode } from "react"
import { LuMonitor, LuUsers } from "react-icons/lu"
import { formatEther } from "viem"

import type { RoundAnalytics } from "@/lib/types"

function useB3trToVthoRate() {
  const { data: b3trUsd } = useGetTokenUsdPrice("B3TR")
  const { data: vthoUsd } = useGetTokenUsdPrice("VTHO")
  if (b3trUsd == null || vthoUsd == null || vthoUsd <= 0) return undefined
  return b3trUsd / vthoUsd
}

function computeROI(rewardsRaw: string, vthoSpentRaw: string, b3trToVtho: number | undefined): number | null {
  if (b3trToVtho == null || b3trToVtho <= 0) return null
  const b3tr = Number(formatEther(BigInt(rewardsRaw)))
  const vtho = Number(formatEther(BigInt(vthoSpentRaw)))
  if (vtho === 0) return null
  return ((b3tr * b3trToVtho) / vtho) * 100
}

function formatToken(rawValue: string, decimals = 2): string {
  const value = Number(formatEther(BigInt(rawValue)))
  return value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return "\u2014"
  return `${((numerator / denominator) * 100).toFixed(1)}%`
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

function SectionHeader({ title, icon }: { title: string; icon?: ReactNode }) {
  return (
    <HStack justify="space-between" w="full">
      <Text textStyle="xs" fontWeight="bold" letterSpacing="wider" textTransform="uppercase" color="text.subtle">
        {title}
      </Text>
      {icon && (
        <Icon color="text.subtle" boxSize="5">
          {icon}
        </Icon>
      )}
    </HStack>
  )
}

function SummaryRow({ label, value, valueColor }: { label: string; value: string | number; valueColor?: string }) {
  return (
    <HStack justify="space-between" w="full">
      <Text textStyle="sm" color="text.subtle">
        {label}
      </Text>
      <Text textStyle="sm" fontWeight="semibold" color={valueColor}>
        {value}
      </Text>
    </HStack>
  )
}

function MetricCell({
  label,
  sublabel,
  value,
  valueColor,
}: {
  label: string
  sublabel?: string
  value: string | number
  valueColor?: string
}) {
  return (
    <VStack gap="1" align="start">
      <Text textStyle="xs" color="text.subtle" fontWeight="semibold">
        {label}
      </Text>
      {sublabel && (
        <Text textStyle="xxs" color="text.subtle">
          {sublabel}
        </Text>
      )}
      <Text textStyle={{ base: "xl", md: "2xl" }} fontWeight="bold" color={valueColor}>
        {value}
      </Text>
    </VStack>
  )
}

function FinancialCell({
  label,
  value,
  unit,
  highlighted,
  valueColor,
}: {
  label: string
  value: string
  unit?: string
  highlighted?: boolean
  valueColor?: string
}) {
  return (
    <HStack justify="space-between" w="full" px="3" py="2" rounded="lg" bg={highlighted ? "bg.tertiary" : undefined}>
      <Text textStyle="sm" color="text.subtle">
        {label}
      </Text>
      <HStack gap="1">
        <Text textStyle="sm" fontWeight="semibold" color={valueColor}>
          {value}
        </Text>
        {unit && (
          <Text textStyle="xs" color="text.subtle">
            {unit}
          </Text>
        )}
      </HStack>
    </HStack>
  )
}

function MiniStatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card.Root variant="primary" p="4">
      <VStack gap="1" align="start">
        <Text textStyle="xs" textTransform="uppercase" color="text.subtle" fontWeight="semibold" letterSpacing="wider">
          {label}
        </Text>
        <Text textStyle={{ base: "xl", md: "2xl" }} fontWeight="bold">
          {typeof value === "number" ? value.toLocaleString() : value}
        </Text>
      </VStack>
    </Card.Root>
  )
}

interface RoundDetailContentProps {
  round: RoundAnalytics
  generatedAt?: string
}

export function RoundDetailContent({ round, generatedAt }: RoundDetailContentProps) {
  const b3trToVtho = useB3trToVthoRate()

  const completionPct =
    round.expectedActions > 0 ? Math.round((round.completedActions / round.expectedActions) * 100) : 0

  const participation = pct(round.votedForCount, round.autoVotingUsersCount)

  const efficiencyDenom = round.autoVotingUsersCount - round.reducedUsersCount
  const efficiency = efficiencyDenom > 0 ? pct(round.votedForCount, efficiencyDenom) : "\u2014"

  const roiRewardsRaw = round.isRoundEnded ? round.totalRelayerRewardsRaw : round.estimatedRelayerRewardsRaw
  const roi = computeROI(roiRewardsRaw, round.vthoSpentTotalRaw, b3trToVtho)
  const roiLabel = round.isRoundEnded ? "ROI" : "Expected ROI"

  const statusColor =
    round.allActionsOk || round.actionStatus.startsWith("\u2713")
      ? "status.positive.primary"
      : round.actionStatus.startsWith("\u26A0")
        ? "status.warning.primary"
        : undefined

  return (
    <VStack gap="4" align="stretch">
      <Grid templateColumns={{ base: "1fr", lg: "2fr 3fr" }} gap="4" alignItems="start">
        {/* Left Column */}
        <VStack gap="4" align="stretch">
          <Card.Root variant="primary">
            <Card.Body>
              <VStack gap="4" align="stretch">
                <SectionHeader title="Round Summary" />
                <VStack gap="2" align="stretch">
                  <SummaryRow label="Current Status" value={round.actionStatus} valueColor={statusColor} />
                  <SummaryRow label="Total Users" value={round.autoVotingUsersCount.toLocaleString()} />
                  <SummaryRow label="Active Relayers" value={round.numRelayers} />
                </VStack>
                <Separator />
                <VStack gap="2" align="stretch">
                  <HStack justify="space-between" w="full">
                    <Text textStyle="sm" fontWeight="semibold">
                      {"Completion Progress"}
                    </Text>
                    <Text textStyle="sm" fontWeight="semibold" color="status.info.strong">
                      {completionPct}
                      {"%"}
                    </Text>
                  </HStack>
                  <Progress.Root value={completionPct} colorPalette="blue" size="sm">
                    <Progress.Track>
                      <Progress.Range />
                    </Progress.Track>
                  </Progress.Root>
                  {generatedAt && (
                    <Text textStyle="xxs" textTransform="uppercase" color="text.subtle" letterSpacing="wider">
                      {"Updated "}
                      {timeAgo(generatedAt)}
                    </Text>
                  )}
                </VStack>
              </VStack>
            </Card.Body>
          </Card.Root>

          <SimpleGrid columns={2} gap="4">
            <MiniStatCard label="Voted for" value={round.votedForCount} />
            <MiniStatCard label="Claims" value={round.rewardsClaimedCount} />
          </SimpleGrid>
        </VStack>

        {/* Right Column */}
        <VStack gap="4" align="stretch">
          <Card.Root variant="primary">
            <Card.Body>
              <VStack gap="4" align="stretch">
                <SectionHeader title="User Activity & Actions" icon={<LuUsers />} />
                <SimpleGrid columns={2} gap="4">
                  <MetricCell
                    label="Expected Actions"
                    sublabel="Projected based on users"
                    value={round.expectedActions.toLocaleString()}
                  />
                  <MetricCell
                    label="Completed Actions"
                    sublabel="Successfully executed"
                    value={round.completedActions.toLocaleString()}
                    valueColor="status.positive.primary"
                  />
                  <MetricCell label="Auto-vote Participation" value={participation} />
                  <MetricCell label="Efficiency Rate" value={efficiency} valueColor="status.positive.primary" />
                </SimpleGrid>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root variant="primary">
            <Card.Body>
              <VStack gap="3" align="stretch">
                <SectionHeader title="Financials & Performance" icon={<LuMonitor />} />
                <SimpleGrid columns={{ base: 1, md: 2 }} gap="2">
                  <FinancialCell label="VTHO (Voting)" value={formatToken(round.vthoSpentOnVotingRaw)} unit="VTHO" />
                  <FinancialCell
                    label="Accrued Rewards"
                    value={formatToken(round.totalRelayerRewardsRaw)}
                    unit="B3TR"
                  />
                  <FinancialCell
                    label="VTHO (Claiming)"
                    value={formatToken(round.vthoSpentOnClaimingRaw)}
                    unit="VTHO"
                  />
                  <FinancialCell
                    label="Projected Rewards"
                    value={formatToken(round.estimatedRelayerRewardsRaw)}
                    unit="B3TR"
                  />
                  <FinancialCell
                    label="Total VTHO Spent"
                    value={formatToken(round.vthoSpentTotalRaw)}
                    unit="VTHO"
                    highlighted
                  />
                  <FinancialCell
                    label={roiLabel}
                    value={roi != null ? `${Math.round(roi).toLocaleString()}%` : "\u2014"}
                    highlighted
                    valueColor="status.positive.primary"
                  />
                </SimpleGrid>
              </VStack>
            </Card.Body>
          </Card.Root>
        </VStack>
      </Grid>
    </VStack>
  )
}
