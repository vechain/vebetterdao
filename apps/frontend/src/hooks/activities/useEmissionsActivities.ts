import { useMemo } from "react"

import { useXAllocationsDecay } from "@/api/contracts/emissions/hooks/useXAllocationsDecay"
import { useXAllocationsDecayPeriod } from "@/api/contracts/emissions/hooks/useXAllocationsDecayPeriod"
import { useAllocationAmount } from "@/api/contracts/xAllocations/hooks/useAllocationAmount"
import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"

import { ActivityItem, ActivityType } from "./types"

const sumAllocations = (a: { treasury: string; voteX2Earn: string; voteXAllocations: string; gm: string }) =>
  parseFloat(a.treasury) + parseFloat(a.voteX2Earn) + parseFloat(a.voteXAllocations) + parseFloat(a.gm)

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

    const currentTotal = sumAllocations(currentAmount)
    const previousTotal = sumAllocations(previousAmount)

    if (currentTotal >= previousTotal) return []

    const percentageChange = previousTotal !== 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0

    const roundNum = Number(currentRoundId)
    const period = Number(decayPeriod ?? 0)
    let nextDecreaseRound = "0"
    if (period > 0) {
      const remainder = roundNum % period
      nextDecreaseRound = String(roundNum + (period - remainder))
    }

    const date = round?.voteStartTimestamp?.unix() ?? 0

    return [
      {
        type: ActivityType.EMISSIONS_DECREASED,
        date,
        roundId: currentRoundId,
        title: "Emissions decreased",
        metadata: {
          currentTotal: String(currentTotal),
          previousTotal: String(previousTotal),
          appsAmount: currentAmount.voteXAllocations,
          treasuryAmount: currentAmount.treasury,
          votersAmount: currentAmount.voteX2Earn,
          gmAmount: currentAmount.gm,
          percentageChange: Math.round(percentageChange * 100) / 100,
          nextDecreaseRound,
          nextDecreasePercentage: Number(decayRate ?? 0),
        },
      },
    ]
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
