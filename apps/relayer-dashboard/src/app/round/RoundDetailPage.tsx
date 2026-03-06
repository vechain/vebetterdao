"use client"

import { Text, VStack } from "@chakra-ui/react"
import { useSearchParams } from "next/navigation"

import { RoundDetailContent } from "@/components/RoundDetailContent"
import { RoundDetailHeader } from "@/components/RoundDetailHeader"
import { RoundDetailSkeleton } from "@/components/RoundDetailSkeleton"
import { useReportData } from "@/hooks/useReportData"
import type { RoundAnalytics } from "@/lib/types"

function parseRoundId(param: string | null): number | undefined {
  if (!param) return undefined
  const parsed = parseInt(param, 10)
  return isNaN(parsed) ? undefined : parsed
}

export default function RoundDetailPage() {
  const searchParams = useSearchParams()
  const roundIdParam = searchParams.get("roundId")
  const roundId = parseRoundId(roundIdParam)

  const { data: report, isLoading, error } = useReportData()

  const round = report && roundId != null ? report.rounds.find(r => r.roundId === roundId) : null
  const firstRound = report?.firstRound ?? 1
  const currentRound = report?.currentRound ?? 1

  if (isLoading || !report) {
    return (
      <VStack w="full" align="stretch" gap="4">
        <RoundDetailSkeleton />
      </VStack>
    )
  }

  if (error) {
    return (
      <VStack w="full" align="stretch" gap="4">
        <RoundDetailHeader round={null} firstRound={firstRound} currentRound={currentRound} />
        <Text color="status.negative.primary" textStyle="sm">
          {"Failed to load report data."}
        </Text>
      </VStack>
    )
  }

  const effectiveRoundId = roundId ?? currentRound
  const roundOutOfRange = effectiveRoundId < firstRound || effectiveRoundId > currentRound

  if (roundOutOfRange) {
    return (
      <VStack w="full" align="stretch" gap="4">
        <RoundDetailHeader round={null} firstRound={firstRound} currentRound={currentRound} />
        <Text color="text.subtle" textStyle="sm">
          {"Round "}
          {effectiveRoundId}
          {" not found. Valid range: "}
          {firstRound}
          {"–"}
          {currentRound}
        </Text>
      </VStack>
    )
  }

  if (!round) {
    const placeholderRound: RoundAnalytics = {
      roundId: effectiveRoundId,
      autoVotingUsersCount: 0,
      votedForCount: 0,
      rewardsClaimedCount: 0,
      totalRelayerRewards: "0",
      totalRelayerRewardsRaw: "0",
      estimatedRelayerRewards: "0",
      estimatedRelayerRewardsRaw: "0",
      numRelayers: 0,
      vthoSpentOnVoting: "0",
      vthoSpentOnVotingRaw: "0",
      vthoSpentOnClaiming: "0",
      vthoSpentOnClaimingRaw: "0",
      vthoSpentTotal: "0",
      vthoSpentTotalRaw: "0",
      expectedActions: 0,
      completedActions: 0,
      reducedUsersCount: 0,
      missedUsersCount: 0,
      allActionsOk: false,
      actionStatus: "No data yet",
      isRoundEnded: effectiveRoundId < currentRound,
    }
    return (
      <VStack w="full" align="stretch" gap="4">
        <RoundDetailHeader round={placeholderRound} firstRound={firstRound} currentRound={currentRound} />
        <RoundDetailContent round={placeholderRound} generatedAt={report.generatedAt} />
      </VStack>
    )
  }

  return (
    <VStack w="full" align="stretch" gap="4">
      <RoundDetailHeader round={round} firstRound={firstRound} currentRound={currentRound} />
      <RoundDetailContent round={round} generatedAt={report.generatedAt} />
    </VStack>
  )
}
