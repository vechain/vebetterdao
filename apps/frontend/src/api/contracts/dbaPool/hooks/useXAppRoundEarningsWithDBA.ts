import { useMemo } from "react"

import { useXAppRoundEarnings } from "../../xAllocationPool/hooks/useXAppRoundEarnings"
import { DBA_ELIGIBILITY_THRESHOLD_PERCENTAGE } from "../constants"

import { useDBADistributionStartRound } from "./useDBADistributionStartRound"
import { useEstimateDBAForActiveRound } from "./useEstimateDBAForActiveRound"

/**
 * Hook that returns earnings for an app in an ACTIVE round with DBA estimation
 * Performs full eligibility validation and estimates DBA rewards
 *
 * Validates eligibility criteria:
 * - Vote percentage < 7.5%
 * - App is currently endorsed
 * - App has rewarded at least 1 action in the round
 *
 * @param roundId The round ID
 * @param xAppId The app ID
 * @param votePercentage The app's vote percentage (0-100)
 * @param isRoundActive Whether the round is active
 * @param enabled Whether to fetch data (optional, defaults to true)
 * @returns Combined earnings data with estimated DBA
 */
export const useXAppRoundEarningsWithDBA = (
  roundId: string,
  xAppId: string,
  votePercentage: number,
  isRoundActive: boolean,
  enabled: boolean = true,
) => {
  // Get base round earnings
  const { data: roundEarnings, isLoading: isRoundEarningsLoading } = useXAppRoundEarnings(roundId, xAppId, enabled)

  // Get DBA distribution start round from contract (cached forever)
  const { data: dbaStartRound } = useDBADistributionStartRound()

  // Check if round is eligible for DBA (basic check for active rounds)
  const roundIdNum = Number(roundId)
  const shouldFetchDBAEstimate =
    enabled &&
    isRoundActive &&
    dbaStartRound !== undefined &&
    roundIdNum >= dbaStartRound &&
    votePercentage < DBA_ELIGIBILITY_THRESHOLD_PERCENTAGE

  // For active rounds: estimate DBA rewards (with full eligibility checks inside)
  const { data: activeRoundEstimate } = useEstimateDBAForActiveRound(roundId, shouldFetchDBAEstimate)

  const result = useMemo(() => {
    const baseAmount = roundEarnings?.amount ?? "0"
    let dbaAmount = "0"
    let hasDBARewards = false

    // For active rounds: use estimated DBA if app is in eligible list
    if (isRoundActive && activeRoundEstimate) {
      const eligibleAppIds = (activeRoundEstimate.eligibleAppIds as string[] | undefined) ?? []
      if (eligibleAppIds.includes(xAppId)) {
        dbaAmount = activeRoundEstimate.estimatedAmount ?? "0"
        hasDBARewards = parseFloat(dbaAmount) > 0
      }
    }

    const totalAmount = (parseFloat(baseAmount) + parseFloat(dbaAmount)).toString()

    return {
      baseEarnings: baseAmount,
      dbaEarnings: dbaAmount,
      totalEarnings: totalAmount,
      appId: xAppId,
      hasDBARewards,
      isRoundActive,
      isSimulation: true, // Always simulation for active rounds
    }
  }, [roundEarnings, activeRoundEstimate, isRoundActive, xAppId])

  return {
    data: result,
    isLoading: isRoundEarningsLoading,
  }
}
