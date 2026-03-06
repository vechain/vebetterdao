"use client"

import { Badge, Card, HStack, IconButton, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { useGetTokenUsdPrice } from "@vechain/vechain-kit"
import NextLink from "next/link"
import { FaAngleRight } from "react-icons/fa6"
import { formatEther } from "viem"

import type { RoundAnalytics } from "@/lib/types"

interface RoundCardProps {
  round: RoundAnalytics
  previousRounds?: RoundAnalytics[]
}

function useB3trToVthoRate() {
  const { data: b3trUsd } = useGetTokenUsdPrice("B3TR")
  const { data: vthoUsd } = useGetTokenUsdPrice("VTHO")
  if (b3trUsd == null || vthoUsd == null || vthoUsd <= 0) return undefined
  return b3trUsd / vthoUsd
}

function parseRoundROI(
  round: { totalRelayerRewardsRaw: string; vthoSpentTotalRaw: string },
  b3trToVtho: number | undefined,
): number | null {
  if (b3trToVtho == null || b3trToVtho <= 0) return null
  const b3tr = Number(formatEther(BigInt(round.totalRelayerRewardsRaw)))
  const vtho = Number(formatEther(BigInt(round.vthoSpentTotalRaw)))
  if (vtho === 0) return null
  return ((b3tr * b3trToVtho) / vtho) * 100
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <VStack gap="0" align="start" minW="0">
      <Text textStyle="xxs" color="text.subtle" lineClamp={1}>
        {label}
      </Text>
      <Text textStyle="sm" fontWeight="semibold" lineClamp={1}>
        {value}
      </Text>
    </VStack>
  )
}

function getAverageRoi(rounds: RoundAnalytics[], b3trToVtho: number | undefined): number | null {
  if (b3trToVtho == null) return null
  const rois = rounds.map(r => parseRoundROI(r, b3trToVtho)).filter((r): r is number => r != null)
  if (rois.length === 0) return null
  return rois.reduce((a, b) => a + b, 0) / rois.length
}

export function RoundCard({ round, previousRounds = [] }: RoundCardProps) {
  const b3trToVtho = useB3trToVthoRate()
  const roi = parseRoundROI(round, b3trToVtho)
  const rewardsUnknown = !round.isRoundEnded
  const concludedWithRoi = previousRounds.filter(r => r.isRoundEnded && r.allActionsOk && r.vthoSpentTotalRaw !== "0")
  const potentialRoi = getAverageRoi(concludedWithRoi, b3trToVtho)

  return (
    <NextLink href={`/round?roundId=${round.roundId}`} style={{ textDecoration: "none", color: "inherit" }}>
      <Card.Root variant="action">
        <Card.Body>
          <HStack justify="space-between" w="full" gap="2">
            <VStack align="stretch" gap="3" w="full">
              <HStack justify="space-between" w="full" flexWrap="wrap" gap="2">
                <HStack gap="3" flexWrap="wrap">
                  <Text fontWeight="bold" textStyle={{ base: "md", md: "lg" }}>
                    {"#"}
                    {round.roundId}
                  </Text>
                  {round.isRoundEnded ? (
                    <Badge size="sm" variant="subtle" colorPalette="gray">
                      {"Concluded"}
                    </Badge>
                  ) : (
                    <Badge size="sm" variant="solid" colorPalette="blue">
                      {"Active"}
                    </Badge>
                  )}
                </HStack>
              </HStack>
              <SimpleGrid columns={{ base: 2, sm: 3, md: 6 }} gap={{ base: 2, md: 4 }}>
                <StatPill label="Users" value={round.autoVotingUsersCount} />
                <StatPill label="Active relayers" value={round.numRelayers} />
                <StatPill label="Status" value={round.actionStatus} />
                <StatPill label="VTHO spent" value={round.vthoSpentTotal} />
                <StatPill label="Rewards" value={rewardsUnknown ? "-" : round.totalRelayerRewards} />
                <StatPill
                  label={rewardsUnknown ? "Potential ROI" : "ROI"}
                  value={
                    rewardsUnknown
                      ? potentialRoi != null
                        ? `~${Math.round(potentialRoi)}%`
                        : "-"
                      : roi != null
                        ? `${Math.round(roi)}%`
                        : "-"
                  }
                />
              </SimpleGrid>
            </VStack>
            <IconButton aria-label="Go to round" variant="ghost">
              <FaAngleRight />
            </IconButton>
          </HStack>
        </Card.Body>
      </Card.Root>
    </NextLink>
  )
}
