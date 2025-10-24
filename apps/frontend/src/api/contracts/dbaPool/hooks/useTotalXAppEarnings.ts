import { useMemo } from "react"

import { useXAppRoundEarnings } from "../../xAllocationPool/hooks/useXAppRoundEarnings"
import { useAllocationsRoundState } from "../../xAllocations/hooks/useAllocationsRoundState"

import { useDBADistributionStartRound } from "./useDBADistributionStartRound"
import { useDBARewards } from "./useDBARewards"
import { useEstimateDBAForActiveRound } from "./useEstimateDBAForActiveRound"

const DBA_ELIGIBILITY_THRESHOLD = 7.5 // percentage

/**
 * Hook that returns the total earnings for an app in a round
 * This includes:
 * - roundEarnings (from XAllocationPool)
 * - DBA rewards (actual or estimated based on round state)
 *
 * For active rounds: estimates DBA rewards using actual unallocated amounts
 * For concluded rounds: shows actual distributed DBA rewards from events
 *
 * @param roundId The round ID
 * @param xAppId The app ID
 * @param votePercentage The app's vote percentage (0-100)
 * @returns Combined earnings data
 */
export const useTotalXAppEarnings = (roundId: string, xAppId: string, votePercentage: number) => {
  // Get base round earnings
  const { data: roundEarnings, isLoading: isRoundEarningsLoading } = useXAppRoundEarnings(roundId, xAppId)

  // Get round state to determine if it's concluded or live
  const { data: roundState, isLoading: isRoundStateLoading } = useAllocationsRoundState(roundId)

  // Get DBA distribution start round from contract (cached forever)
  const { data: dbaStartRound } = useDBADistributionStartRound()

  // Determine if round is active (0 = Active)
  const isRoundActive = roundState === 0

  // Check eligibility for DBA (inline)
  const roundIdNum = Number(roundId)
  const isEligible =
    dbaStartRound !== undefined && roundIdNum >= dbaStartRound && votePercentage < DBA_ELIGIBILITY_THRESHOLD

  // For active rounds: estimate DBA rewards using actual unallocated amounts from contract
  const { data: activeRoundEstimate } = useEstimateDBAForActiveRound(roundId, isEligible && isRoundActive)

  // For concluded rounds: fetch actual DBA rewards from events
  const { data: dbaRewards, isLoading: isDBARewardsLoading } = useDBARewards(roundId, xAppId)

  const result = useMemo(() => {
    const baseAmount = roundEarnings?.amount ?? "0"

    // Check if DBA has already been distributed (actual rewards exist)
    const hasActualDBARewards = dbaRewards?.hasRewards ?? false

    if (hasActualDBARewards) {
      // Concluded rounds with actual DBA distribution - show actual amounts
      const dbaAmount = dbaRewards?.amount ?? "0"
      const totalAmount = (parseFloat(baseAmount) + parseFloat(dbaAmount)).toString()

      return {
        baseEarnings: baseAmount,
        dbaEarnings: dbaAmount,
        totalEarnings: totalAmount,
        appId: xAppId,
        hasDBARewards: true,
        isRoundActive: false,
        isSimulation: false,
      }
    } else if (isRoundActive && isEligible) {
      // Active rounds with eligibility - show estimated DBA
      const dbaAmount = activeRoundEstimate?.estimatedAmount ?? "0"
      const totalAmount = (parseFloat(baseAmount) + parseFloat(dbaAmount)).toString()

      return {
        baseEarnings: baseAmount,
        dbaEarnings: dbaAmount,
        totalEarnings: totalAmount,
        appId: xAppId,
        hasDBARewards: parseFloat(dbaAmount) > 0,
        isRoundActive: true,
        isSimulation: true,
        estimationDetails: activeRoundEstimate,
      }
    } else {
      // Concluded rounds without DBA or ineligible apps - show only base earnings
      return {
        baseEarnings: baseAmount,
        dbaEarnings: "0",
        totalEarnings: baseAmount,
        appId: xAppId,
        hasDBARewards: false,
        isRoundActive: isRoundActive,
        isSimulation: false,
      }
    }
  }, [roundEarnings, dbaRewards, activeRoundEstimate, isRoundActive, isEligible, xAppId])

  return {
    data: result,
    isLoading: isRoundEarningsLoading || isRoundStateLoading || (!isRoundActive && isDBARewardsLoading),
  }
}
