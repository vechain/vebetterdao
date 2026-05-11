import { useMemo } from "react"

import { useVote2EarnDecay } from "@/api/contracts/emissions/hooks/useVote2EarnDecay"
import { useVote2EarnDecayPeriod } from "@/api/contracts/emissions/hooks/useVote2EarnDecayPeriod"
import { useXAllocationsDecay } from "@/api/contracts/emissions/hooks/useXAllocationsDecay"
import { useXAllocationsDecayPeriod } from "@/api/contracts/emissions/hooks/useXAllocationsDecayPeriod"
import { useAllocationAmount } from "@/api/contracts/xAllocations/hooks/useAllocationAmount"
import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"

import { ActivityItem, ActivityType } from "./types"

type DecayBucket = {
  type:
    | ActivityType.APP_REWARDS_DECREASED
    | ActivityType.VOTER_REWARDS_DECREASED
    | ActivityType.TREASURY_REWARDS_DECREASED
    | ActivityType.GM_REWARDS_DECREASED
  curr: string
  prev: string
  decayRate?: string
  decayPeriod?: string
  title: string
}

const computeNextDecreaseRound = (currentRoundId: string, decayPeriod?: string): string | undefined => {
  const period = Number(decayPeriod ?? 0)
  if (period <= 0) return undefined
  const roundNum = Number(currentRoundId)
  const remainder = roundNum % period
  return String(roundNum + (period - remainder))
}

export const useEmissionsActivities = (
  currentRoundId?: string,
  previousRoundId?: string,
): { data: ActivityItem[]; isLoading: boolean } => {
  const { data: currentAmount, isLoading: isCurrentLoading } = useAllocationAmount(currentRoundId)
  const { data: previousAmount, isLoading: isPreviousLoading } = useAllocationAmount(previousRoundId)
  const { data: round, isLoading: isRoundLoading } = useAllocationsRound(currentRoundId)
  const { data: xDecayPeriod, isLoading: isXDecayPeriodLoading } = useXAllocationsDecayPeriod()
  const { data: xDecayRate, isLoading: isXDecayRateLoading } = useXAllocationsDecay()
  const { data: v2eDecayPeriod, isLoading: isV2eDecayPeriodLoading } = useVote2EarnDecayPeriod()
  const { data: v2eDecayRate, isLoading: isV2eDecayRateLoading } = useVote2EarnDecay()

  const data = useMemo((): ActivityItem[] => {
    if (!currentRoundId || currentRoundId === "0") return []
    if (!previousRoundId || previousRoundId === "0") return []
    if (!currentAmount || !previousAmount) return []

    const date = round?.voteStartTimestamp?.unix() ?? 0

    const buckets: DecayBucket[] = [
      {
        type: ActivityType.APP_REWARDS_DECREASED,
        curr: currentAmount.voteXAllocations,
        prev: previousAmount.voteXAllocations,
        decayRate: xDecayRate,
        decayPeriod: xDecayPeriod,
        title: "App rewards decreased",
      },
      {
        type: ActivityType.VOTER_REWARDS_DECREASED,
        curr: currentAmount.voteX2Earn,
        prev: previousAmount.voteX2Earn,
        decayRate: v2eDecayRate,
        decayPeriod: v2eDecayPeriod,
        title: "Voter rewards decreased",
      },
      {
        type: ActivityType.TREASURY_REWARDS_DECREASED,
        curr: currentAmount.treasury,
        prev: previousAmount.treasury,
        title: "Treasury allocation decreased",
      },
      {
        type: ActivityType.GM_REWARDS_DECREASED,
        curr: currentAmount.gm,
        prev: previousAmount.gm,
        title: "GM rewards decreased",
      },
    ]

    return buckets
      .filter(b => {
        const prev = parseFloat(b.prev)
        const curr = parseFloat(b.curr)
        return prev > 0 && curr < prev
      })
      .map(b => {
        const prev = parseFloat(b.prev)
        const curr = parseFloat(b.curr)
        const percentageChange = Math.round(((curr - prev) / prev) * 10000) / 100
        const nextDecreaseRound =
          b.decayRate !== undefined && b.decayPeriod !== undefined
            ? computeNextDecreaseRound(currentRoundId, b.decayPeriod)
            : undefined
        const nextDecreasePercentage = b.decayRate !== undefined ? Number(b.decayRate) : undefined

        return {
          type: b.type,
          date,
          roundId: currentRoundId,
          title: b.title,
          metadata: {
            currentAmount: b.curr,
            previousAmount: b.prev,
            percentageChange,
            nextDecreaseRound,
            nextDecreasePercentage,
          },
        }
      })
  }, [
    currentRoundId,
    previousRoundId,
    currentAmount,
    previousAmount,
    round?.voteStartTimestamp,
    xDecayPeriod,
    xDecayRate,
    v2eDecayPeriod,
    v2eDecayRate,
  ])

  return {
    data,
    isLoading:
      isCurrentLoading ||
      isPreviousLoading ||
      isRoundLoading ||
      isXDecayPeriodLoading ||
      isXDecayRateLoading ||
      isV2eDecayPeriodLoading ||
      isV2eDecayRateLoading,
  }
}
