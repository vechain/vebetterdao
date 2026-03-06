"use client"

import { Badge, Box, Card, HStack, IconButton, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { FaAngleRight } from "react-icons/fa6"

import { formatNumber, formatToken } from "@/lib/format"
import type { RoundAnalytics } from "@/lib/types"

interface RoundCardProps {
  round: RoundAnalytics
  roi: number | null
  expectedRoi: number | null
}

function StatPill({
  label,
  value,
  unit,
  valueColor,
}: {
  label: string
  value?: string | number
  unit?: string
  valueColor?: string
}) {
  return (
    <VStack gap="0" align="start" minW="0" justifyContent="center">
      <Text textStyle="xxs" color="text.subtle" lineClamp={1}>
        {label}
      </Text>
      {value != null && (
        <HStack gap="1" align="baseline">
          <Text textStyle="sm" fontWeight="semibold" lineClamp={1} color={valueColor}>
            {value}
          </Text>
          {unit && (
            <Text textStyle="xxs" color="text.subtle">
              {unit}
            </Text>
          )}
        </HStack>
      )}
    </VStack>
  )
}

function statusColor(round: RoundAnalytics): string | undefined {
  if (round.allActionsOk || round.actionStatus.startsWith("\u2713")) return "status.positive.primary"
  if (round.actionStatus.startsWith("\u26A0")) return "status.warning.primary"
  return undefined
}

export function RoundCard({ round, roi, expectedRoi }: RoundCardProps) {
  const isActive = !round.isRoundEnded
  const displayRoi = isActive ? expectedRoi : roi
  const roiLabel = isActive ? "Expected ROI" : "ROI"

  const roundLabel = (
    <HStack gap="2">
      <Text fontWeight="bold" textStyle="sm">
        {"#"}
        {round.roundId}
      </Text>
      {isActive && (
        <Badge size="sm" variant="solid" colorPalette="blue">
          {"Active"}
        </Badge>
      )}
    </HStack>
  )

  const stats = (
    <>
      <StatPill label="Users" value={formatNumber(round.autoVotingUsersCount)} />
      <StatPill label="Relayers" value={round.numRelayers} />
      <StatPill label="VTHO spent" value={formatToken(round.vthoSpentTotalRaw)} unit="VTHO" />
      <StatPill
        label={isActive ? "Projected Rewards" : "Rewards"}
        value={formatToken(isActive ? round.estimatedRelayerRewardsRaw : round.totalRelayerRewardsRaw)}
        unit="B3TR"
      />
      <StatPill
        label={roiLabel}
        value={displayRoi != null ? `${formatNumber(Math.round(displayRoi))}%` : "-"}
        valueColor={displayRoi != null ? "status.positive.primary" : undefined}
      />
    </>
  )

  return (
    <NextLink href={`/round?roundId=${round.roundId}`} style={{ textDecoration: "none", color: "inherit" }}>
      <Card.Root variant="action">
        <Card.Body>
          {/* Desktop: single row */}
          <Box hideBelow="md">
            <HStack justify="space-between" w="full" gap="2">
              <SimpleGrid columns={7} gap="4" w="full" alignItems="center">
                <Box>{roundLabel}</Box>
                {stats}
                <StatPill label="Status" value={round.actionStatus} valueColor={statusColor(round)} />
              </SimpleGrid>
              <IconButton aria-label="Go to round" variant="ghost" size="sm">
                <FaAngleRight />
              </IconButton>
            </HStack>
          </Box>

          {/* Mobile: stacked */}
          <Box hideFrom="md">
            <VStack gap="2" align="stretch" w="full">
              <HStack justify="space-between" w="full">
                {roundLabel}
                <IconButton aria-label="Go to round" variant="ghost" size="sm">
                  <FaAngleRight />
                </IconButton>
              </HStack>
              <SimpleGrid columns={{ base: 2, sm: 3 }} gap="2">
                {stats}
              </SimpleGrid>
            </VStack>
          </Box>
        </Card.Body>
      </Card.Root>
    </NextLink>
  )
}
