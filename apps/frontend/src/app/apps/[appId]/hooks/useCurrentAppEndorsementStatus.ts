import { useAppEndorsementScore, useEndorsementScoreThreshold, useIsAppUnendorsed } from "@/api"
import { useIsAppEligible } from "@/api/contracts/xApps/hooks/endorsement/useIsAppEligible"
import { EndorsementStatus } from "@/types"
import { useParams } from "next/navigation"

/**
 * Determine the current app endorsement status
 * @param isAppUnendorsed Whether the app is unendorsed
 * @param isEligibleNow Whether the app is eligible now
 * @param score The app endorsement score
 * @param threshold The endorsement score threshold
 * @returns The current app endorsement status
 */
const determineStatus = (isAppUnendorsed?: boolean, isEligibleNow?: boolean, score: number = 0, threshold?: number) => {
  if (typeof isAppUnendorsed === "undefined" || typeof isEligibleNow === "undefined" || !threshold) {
    return EndorsementStatus.UNKNOWN
  }

  if (!isAppUnendorsed && isEligibleNow && score >= threshold) {
    return EndorsementStatus.SUCCESS
  }

  //App in the grace period
  if (!isAppUnendorsed && isEligibleNow) {
    return EndorsementStatus.LOST
  }

  if (isAppUnendorsed && !isEligibleNow) {
    return EndorsementStatus.PENDING
  }

  return EndorsementStatus.UNKNOWN
}

/**
 * Hook to get the current app endorsement status
 * @returns The current app endorsement status
 */
export const useCurrentAppEndorsementStatus = () => {
  const { appId } = useParams<{ appId: string }>()
  const { data: threshold, isLoading: isEndorsementThresholdLoading } = useEndorsementScoreThreshold()
  const { data: score, isLoading: isEndorsementScoreLoading } = useAppEndorsementScore(appId)
  const { data: isEligibleNow, isLoading: isEligibleNowLoading } = useIsAppEligible(appId)
  const { data: isUnendorsed, isLoading: isUnendorsedLoading } = useIsAppUnendorsed(appId)
  const isLoading =
    isEndorsementThresholdLoading || isEndorsementScoreLoading || isEligibleNowLoading || isUnendorsedLoading
  const status = determineStatus(isUnendorsed, isEligibleNow, Number(score), Number(threshold))
  return {
    threshold,
    score,
    status,
    isLoading,
  }
}
