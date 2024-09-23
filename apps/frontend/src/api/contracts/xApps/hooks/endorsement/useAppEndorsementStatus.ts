import { useAppEndorsementScore, useEndorsementScoreThreshold, useIsAppUnendorsed } from "@/api"
import { useIsAppEligibleNow } from "@/api/contracts/xApps/hooks/endorsement/useIsAppEligibleNow"
import { EndorsementStatus } from "@/types"
import { useParams } from "next/navigation"

/**
 * Determine the current app endorsement status
 * @param isUnendorsed Whether the app is unendorsed
 * @param isEligibleNow Whether the app is eligible now
 * @param score The app endorsement score
 * @param threshold The endorsement score threshold
 * @returns The current app endorsement status
 */
const determineAppStatus = (
  isUnendorsed: boolean | undefined,
  isEligibleNow: boolean | undefined,
  score: number,
  threshold: number,
) => {
  if (typeof isUnendorsed === "undefined" || typeof isEligibleNow === "undefined" || isNaN(score) || isNaN(threshold)) {
    return EndorsementStatus.UNKNOWN
  }

  if (!isUnendorsed && score >= threshold) {
    return EndorsementStatus.SUCCESS
  }

  //App in the grace period
  if (isUnendorsed && isEligibleNow) {
    return EndorsementStatus.LOST
  }

  if (isUnendorsed && !isEligibleNow) {
    return EndorsementStatus.PENDING
  }

  return EndorsementStatus.UNKNOWN
}

/**
 * Hook to get the current app endorsement status
 * @returns {Object} An object containing the following properties:
 * - `threshold`: The endorsement score threshold
 * - `score`: The current endorsement score of the app
 * - `status`: The computed endorsement status based on the threshold, score, eligibility, and unendorsement status
 * - `isLoading`: A boolean indicating if any of the data fetching operations are still in progress
 */
export const useCurrentAppEndorsementStatus = () => {
  const { appId } = useParams<{ appId: string }>()
  const { data: threshold, isLoading: isEndorsementThresholdLoading } = useEndorsementScoreThreshold()
  const { data: score, isLoading: isEndorsementScoreLoading } = useAppEndorsementScore(appId)
  const { data: isEligibleNow, isLoading: isEligibleNowLoading } = useIsAppEligibleNow(appId)
  const { data: isUnendorsed, isLoading: isUnendorsedLoading } = useIsAppUnendorsed(appId)
  const isLoading =
    isEndorsementThresholdLoading || isEndorsementScoreLoading || isEligibleNowLoading || isUnendorsedLoading
  const status = determineAppStatus(isUnendorsed, isEligibleNow, Number(score), Number(threshold))
  return {
    threshold,
    score,
    status,
    isLoading,
  }
}
