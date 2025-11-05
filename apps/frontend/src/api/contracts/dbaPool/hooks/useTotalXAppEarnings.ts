import { useMemo } from "react"

import { useAppEarnings } from "../../../indexer/xallocations/useAppEarnings"
import { useAllocationsRoundState } from "../../xAllocations/hooks/useAllocationsRoundState"

import { useXAppRoundEarningsWithDBA } from "./useXAppRoundEarningsWithDBA"

/**
 * Hook that returns the total earnings for an app in a round
 *
 * Routes to the appropriate data source based on round state:
 * - Active rounds: Uses contract-based estimation with full DBA eligibility validation
 * - Concluded rounds: Uses indexer which already includes DBA in totalAmount
 *
 * @param roundId The round ID
 * @param xAppId The app ID
 * @param votePercentage The app's vote percentage (0-100)
 * @returns Combined earnings data with consistent interface
 */
export const useTotalXAppEarnings = (roundId: string, xAppId: string, votePercentage: number) => {
  // Get round state to determine routing
  const { data: roundState, isLoading: isRoundStateLoading } = useAllocationsRoundState(roundId)

  // Determine if round is active (0 = Active)
  const isRoundActive = roundState === 0
  const isRoundConcluded = roundState !== undefined && roundState !== 0

  // For concluded rounds: use indexer (already includes DBA)
  // Only fetch when round is concluded
  const { data: indexerData, isLoading: isIndexerLoading } = useAppEarnings(
    xAppId,
    {
      roundId: Number(roundId),
    },
    {
      enabled: isRoundConcluded,
    },
  )

  // For active rounds: use contract-based estimation
  const { data: contractData, isLoading: isContractLoading } = useXAppRoundEarningsWithDBA(
    roundId,
    xAppId,
    votePercentage,
    isRoundActive,
    isRoundActive, // Only enabled when round is active
  )

  const result = useMemo(() => {
    // Use indexer for concluded rounds
    if (!isRoundActive && indexerData && indexerData.length > 0) {
      const earnings = indexerData[0]
      const totalAmount = earnings?.totalAmount?.toString() ?? "0"

      return {
        baseEarnings: totalAmount, // Indexer doesn't split out DBA
        dbaEarnings: "0", // Already included in totalAmount
        totalEarnings: totalAmount,
        appId: xAppId,
        hasDBARewards: false, // Can't determine from indexer
        isRoundActive: false,
        isSimulation: false,
        source: "indexer" as const,
      }
    }

    // Use contract data for active rounds or if indexer has no data
    if (contractData) {
      return {
        ...contractData,
        source: "contract" as const,
      }
    }

    // Fallback
    return {
      baseEarnings: "0",
      dbaEarnings: "0",
      totalEarnings: "0",
      appId: xAppId,
      hasDBARewards: false,
      isRoundActive,
      isSimulation: false,
      source: "none" as const,
    }
  }, [isRoundActive, indexerData, contractData, xAppId])

  return {
    data: result,
    isLoading: isRoundStateLoading || (isRoundActive ? isContractLoading : isIndexerLoading),
  }
}
