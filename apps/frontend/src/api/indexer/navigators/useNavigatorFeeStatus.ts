import { useMemo } from "react"

import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"

import { type NavigatorFeeEntryFormatted, useNavigatorFeeHistory } from "./useNavigatorFeeHistory"
import { useNavigatorFeeSummary } from "./useNavigatorFeeSummary"

export type FeeEntryStatus = "claimable" | "locked" | "claimed"

export const getFeeEntryStatus = (entry: NavigatorFeeEntryFormatted, currentRound: number): FeeEntryStatus => {
  if (entry.claimed) return "claimed"
  if (entry.unlockRound <= currentRound) return "claimable"
  return "locked"
}

export const useNavigatorFeeStatus = (navigator: string) => {
  const { data: summary, isLoading: summaryLoading } = useNavigatorFeeSummary(navigator)
  const {
    data: history,
    isLoading: historyLoading,
    fetchNextPage,
    hasNextPage,
  } = useNavigatorFeeHistory(navigator, 100)
  const { data: currentRoundStr, isLoading: roundLoading } = useCurrentAllocationsRoundId()

  const currentRound = Number(currentRoundStr ?? 0)
  const allEntries = useMemo(() => history?.pages.flat() ?? [], [history])

  const derived = useMemo(() => {
    if (!allEntries.length || !currentRound) {
      return { totalClaimable: 0, totalLocked: 0, claimableRoundIds: [] as number[], nextUnlock: null }
    }

    let totalClaimable = 0
    let totalLocked = 0
    const claimableRoundIds: number[] = []
    let nextUnlock: { round: number; amount: number } | null = null

    for (const entry of allEntries) {
      const status = getFeeEntryStatus(entry, currentRound)
      if (status === "claimable") {
        totalClaimable += entry.totalDepositedFormatted
        claimableRoundIds.push(Number(entry.roundId))
      } else if (status === "locked") {
        totalLocked += entry.totalDepositedFormatted
        if (!nextUnlock || entry.unlockRound < nextUnlock.round) {
          nextUnlock = { round: entry.unlockRound, amount: entry.totalDepositedFormatted }
        }
      }
    }

    return { totalClaimable, totalLocked, claimableRoundIds, nextUnlock }
  }, [allEntries, currentRound])

  return {
    ...derived,
    totalEarned: summary?.totalEarnedFormatted ?? 0,
    totalClaimed: summary?.totalClaimedFormatted ?? 0,
    currentRound,
    allEntries,
    isLoading: summaryLoading || historyLoading || roundLoading,
    fetchNextPage,
    hasNextPage,
  }
}
