import { useMemo } from "react"

import { useXAppRoundEarnings } from "../../xAllocationPool/hooks/useXAppRoundEarnings"

import { useDBADistributionStartRound } from "./useDBADistributionStartRound"
import { useEstimateDBAForActiveRound } from "./useEstimateDBAForActiveRound"

/**
 * Hook that returns earnings for an app in an ACTIVE round with DBA estimation.
 * Eligibility is determined inside useEstimateDBAForActiveRound (endorsed + rewarded actions).
 */
export const useXAppRoundEarningsWithDBA = (
  roundId: string,
  xAppId: string,
  isRoundActive: boolean,
  enabled: boolean = true,
) => {
  // Get base round earnings
  const { data: roundEarnings, isLoading: isRoundEarningsLoading } = useXAppRoundEarnings(roundId, xAppId, enabled)

  // Get DBA distribution start round from contract (cached forever)
  const { data: dbaStartRound } = useDBADistributionStartRound()

  // Check if round is eligible for DBA (basic check for active rounds)
  const roundIdNum = Number(roundId)
  const shouldFetchDBAEstimate = enabled && isRoundActive && dbaStartRound !== undefined && roundIdNum >= dbaStartRound

  // For active rounds: estimate DBA rewards (with full eligibility checks inside)
  const { data: activeRoundEstimate } = useEstimateDBAForActiveRound(roundId, shouldFetchDBAEstimate)

  const result = useMemo(() => {
    const baseAmount = roundEarnings?.amount ?? "0"
    let dbaAmount = "0"
    let hasDBARewards = false

    if (isRoundActive && activeRoundEstimate?.appEstimates?.[xAppId]) {
      dbaAmount = activeRoundEstimate.appEstimates[xAppId]
      hasDBARewards = parseFloat(dbaAmount) > 0
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
