import { useMemo } from "react"

import { useXAllocationsDecay } from "@/api/contracts/emissions/hooks/useXAllocationsDecay"
import { useXAllocationsDecayPeriod } from "@/api/contracts/emissions/hooks/useXAllocationsDecayPeriod"
import { useAllocationAmount } from "@/api/contracts/xAllocations/hooks/useAllocationAmount"
import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"

import { ActivityItem, ActivityType } from "./types"

type DecreasedBucket = {
  type:
    | ActivityType.APP_REWARDS_DECREASED
    | ActivityType.VOTER_REWARDS_DECREASED
    | ActivityType.TREASURY_REWARDS_DECREASED
    | ActivityType.GM_REWARDS_DECREASED
  curr: string
  prev: string
  title: string
}

export const useEmissionsActivities = (
  currentRoundId?: string,
  previousRoundId?: string,
): { data: ActivityItem[]; isLoading: boolean } => {
  const { data: currentAmount, isLoading: isCurrentLoading } = useAllocationAmount(currentRoundId)
  const { data: previousAmount, isLoading: isPreviousLoading } = useAllocationAmount(previousRoundId)
  const { data: round, isLoading: isRoundLoading } = useAllocationsRound(currentRoundId)
  const { data: decayPeriod, isLoading: isDecayPeriodLoading } = useXAllocationsDecayPeriod()
  const { data: decayRate, isLoading: isDecayLoading } = useXAllocationsDecay()

  const data = useMemo((): ActivityItem[] => {
    if (!currentRoundId || currentRoundId === "0") return []
    if (!previousRoundId || previousRoundId === "0") return []
    if (!currentAmount || !previousAmount) return []

    const date = round?.voteStartTimestamp?.unix() ?? 0
    const roundNum = Number(currentRoundId)
    const period = Number(decayPeriod ?? 0)
    let nextDecreaseRound = "0"
    if (period > 0) {
      const remainder = roundNum % period
      nextDecreaseRound = String(roundNum + (period - remainder))
    }
    const nextDecreasePercentage = Number(decayRate ?? 0)

    const buckets: DecreasedBucket[] = [
      {
        type: ActivityType.APP_REWARDS_DECREASED,
        curr: currentAmount.voteXAllocations,
        prev: previousAmount.voteXAllocations,
        title: "App rewards decreased",
      },
      {
        type: ActivityType.VOTER_REWARDS_DECREASED,
        curr: currentAmount.voteX2Earn,
        prev: previousAmount.voteX2Earn,
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
    decayPeriod,
    decayRate,
  ])

  return {
    data,
    isLoading: isCurrentLoading || isPreviousLoading || isRoundLoading || isDecayPeriodLoading || isDecayLoading,
  }
}
