import { useMemo } from "react"

import { useVote2EarnDecay } from "@/api/contracts/emissions/hooks/useVote2EarnDecay"
import { useVote2EarnDecayPeriod } from "@/api/contracts/emissions/hooks/useVote2EarnDecayPeriod"
import { useXAllocationsDecay } from "@/api/contracts/emissions/hooks/useXAllocationsDecay"
import { useXAllocationsDecayPeriod } from "@/api/contracts/emissions/hooks/useXAllocationsDecayPeriod"
import { useAllocationAmount } from "@/api/contracts/xAllocations/hooks/useAllocationAmount"
import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"

import { ActivityItem, ActivityType } from "./types"

const sumAllocations = (a: { treasury: string; voteX2Earn: string; voteXAllocations: string; gm: string }) =>
  parseFloat(a.treasury) + parseFloat(a.voteX2Earn) + parseFloat(a.voteXAllocations) + parseFloat(a.gm)

const computeNextDecayRound = (currentRoundId: string, periodStr?: string): string => {
  const period = Number(periodStr ?? 0)
  if (period <= 0) return "0"
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

    const anyDecreased =
      parseFloat(currentAmount.voteXAllocations) < parseFloat(previousAmount.voteXAllocations) ||
      parseFloat(currentAmount.voteX2Earn) < parseFloat(previousAmount.voteX2Earn) ||
      parseFloat(currentAmount.treasury) < parseFloat(previousAmount.treasury) ||
      parseFloat(currentAmount.gm) < parseFloat(previousAmount.gm)

    if (!anyDecreased) return []

    const currentTotal = sumAllocations(currentAmount)
    const previousTotal = sumAllocations(previousAmount)
    const totalPercentageChange =
      previousTotal !== 0 ? Math.round(((currentTotal - previousTotal) / previousTotal) * 10000) / 100 : 0

    const date = round?.voteStartTimestamp?.unix() ?? 0

    return [
      {
        type: ActivityType.EMISSIONS_DECREASED,
        date,
        roundId: currentRoundId,
        title: "Emissions decreased",
        metadata: {
          previousAppsAmount: previousAmount.voteXAllocations,
          previousVotersAmount: previousAmount.voteX2Earn,
          previousTreasuryAmount: previousAmount.treasury,
          previousGmAmount: previousAmount.gm,
          currentAppsAmount: currentAmount.voteXAllocations,
          currentVotersAmount: currentAmount.voteX2Earn,
          currentTreasuryAmount: currentAmount.treasury,
          currentGmAmount: currentAmount.gm,
          previousTotal: String(previousTotal),
          currentTotal: String(currentTotal),
          totalPercentageChange,
          nextEmissionsDecreaseRound: computeNextDecayRound(currentRoundId, xDecayPeriod),
          nextEmissionsDecreasePercentage: Number(xDecayRate ?? 0),
          nextVoterShiftRound: computeNextDecayRound(currentRoundId, v2eDecayPeriod),
          nextVoterShiftPercentage: Number(v2eDecayRate ?? 0),
        },
      },
    ]
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
