import { useMemo } from "react"

import { useNextEmissionsCycle } from "@/api/contracts/emissions/hooks/useNextEmissionsCycle"
import { useXAllocationsDecayPeriod } from "@/api/contracts/emissions/hooks/useXAllocationsDecayPeriod"
import { useAllocationAmount } from "@/api/contracts/xAllocations/hooks/useAllocationAmount"
import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"

import { ActivityItem, ActivityType } from "./types"

export const useEmissionsActivities = (
  currentRoundId?: string,
  previousRoundId?: string,
): { data: ActivityItem[]; isLoading: boolean } => {
  const { data: currentAmount, isLoading: isCurrentLoading } = useAllocationAmount(currentRoundId)
  const { data: previousAmount, isLoading: isPreviousLoading } = useAllocationAmount(previousRoundId)
  const { data: round, isLoading: isRoundLoading } = useAllocationsRound(currentRoundId)
  const { data: decayPeriod, isLoading: isDecayPeriodLoading } = useXAllocationsDecayPeriod()
  const { data: nextCycle, isLoading: isNextCycleLoading } = useNextEmissionsCycle()

  const data = useMemo((): ActivityItem[] => {
    if (!currentRoundId || currentRoundId === "0") return []
    if (!previousRoundId || previousRoundId === "0") return []
    if (!currentAmount || !previousAmount) return []

    const current = currentAmount.voteXAllocations
    const previous = previousAmount.voteXAllocations

    if (current === previous) return []

    const currentNum = parseFloat(current)
    const previousNum = parseFloat(previous)
    const percentageChange = previousNum !== 0 ? ((currentNum - previousNum) / previousNum) * 100 : 0

    const roundNum = Number(currentRoundId)
    const period = Number(decayPeriod ?? 0)
    let nextDecreaseRound = "0"
    if (period > 0) {
      const remainder = roundNum % period
      nextDecreaseRound = String(roundNum + (period - remainder))
    } else if (nextCycle) {
      nextDecreaseRound = nextCycle
    }

    const date = round?.voteStartTimestamp?.unix() ?? 0

    return [
      {
        type: ActivityType.EMISSIONS_DECREASED,
        date,
        roundId: currentRoundId,
        title: "Emissions decreased",
        metadata: {
          currentAmount: current,
          previousAmount: previous,
          percentageChange: Math.round(percentageChange * 100) / 100,
          nextDecreaseRound,
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
    nextCycle,
  ])

  return {
    data,
    isLoading: isCurrentLoading || isPreviousLoading || isRoundLoading || isDecayPeriodLoading || isNextCycleLoading,
  }
}
