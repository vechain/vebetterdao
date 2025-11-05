import { useMemo } from "react"

import { useXAppRoundEarnings } from "../../xAllocationPool/hooks/useXAppRoundEarnings"
import { DBA_ELIGIBILITY_THRESHOLD_PERCENTAGE } from "../constants"

import { useDBADistributionStartRound } from "./useDBADistributionStartRound"
import { useDBARewards } from "./useDBARewards"
import { useEstimateDBAForActiveRound } from "./useEstimateDBAForActiveRound"

/**
 * Hook that returns earnings for an app in a round with DBA calculation
 * This is used for ACTIVE rounds where we estimate DBA based on full eligibility criteria
 *
 * For active rounds: estimates DBA rewards using contract data with full validation
 * For concluded rounds: fetches actual DBA rewards from contract
 *
 * @param roundId The round ID
 * @param xAppId The app ID
 * @param votePercentage The app's vote percentage (0-100)
 * @param isRoundActive Whether the round is active
 * @param enabled Whether to fetch data (optional, defaults to true)
 * @returns Combined earnings data
 */
export const useXAppRoundEarningsWithDBA = (
  roundId: string,
  xAppId: string,
  votePercentage: number,
  isRoundActive: boolean,
  enabled: boolean = true,
) => {
  // Get base round earnings
  const { data: roundEarnings, isLoading: isRoundEarningsLoading } = useXAppRoundEarnings(roundId, xAppId)

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

  // For concluded rounds: fetch actual DBA rewards
  const { data: dbaRewards, isLoading: isDBARewardsLoading } = useDBARewards(roundId, xAppId)

  const result = useMemo(() => {
    const baseAmount = roundEarnings?.amount ?? "0"
    let dbaAmount = "0"
    let hasDBARewards = false
    let isSimulation = false

    // For concluded rounds: use actual DBA from contract
    if (!isRoundActive && dbaRewards?.hasRewards) {
      dbaAmount = dbaRewards.amount
      hasDBARewards = true
      isSimulation = false
    }
    // For active rounds: use estimated DBA if app is in eligible list
    else if (isRoundActive && activeRoundEstimate) {
      const eligibleAppIds = (activeRoundEstimate.eligibleAppIds as string[] | undefined) ?? []
      if (eligibleAppIds.includes(xAppId)) {
        dbaAmount = activeRoundEstimate.estimatedAmount ?? "0"
        hasDBARewards = parseFloat(dbaAmount) > 0
        isSimulation = true
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
      isSimulation,
    }
  }, [roundEarnings, dbaRewards, activeRoundEstimate, isRoundActive, xAppId])

  return {
    data: result,
    isLoading: isRoundEarningsLoading || (!isRoundActive && isDBARewardsLoading),
  }
}
