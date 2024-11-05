import {
  useAppEndorsementScore,
  useAppExists,
  useAppIsBlacklisted,
  useEndorsementScoreThreshold,
  useIsAppEligibleNow,
  useIsAppUnendorsed,
} from "@/api"
import { XAppStatus } from "@/types"

/**
 * Determine the current app endorsement status
 * @param isUnendorsed Whether the app is unendorsed
 * @param isEligibleNow Whether the app is eligible now
 * @param isBlacklisted Whether the app is blacklisted
 * @param score The app endorsement score
 * @param threshold The endorsement score threshold
 * @returns The current app endorsement status
 */
const determineAppStatus = (
  isUnendorsed: boolean | undefined,
  isEligibleNow: boolean | undefined,
  isBlacklisted: boolean | undefined,
  appHasBeenIntoAllocationRounds: boolean | undefined,
  score: number,
  threshold: number,
) => {
  if (
    typeof isUnendorsed === "undefined" ||
    typeof isEligibleNow === "undefined" ||
    typeof isBlacklisted === "undefined" ||
    typeof appHasBeenIntoAllocationRounds === "undefined" ||
    isNaN(score) ||
    isNaN(threshold)
  ) {
    return XAppStatus.UNKNOWN
  }

  if (isBlacklisted) {
    return XAppStatus.BLACKLISTED
  }

  if (!appHasBeenIntoAllocationRounds) {
    return XAppStatus.LOOKING_FOR_ENDORSEMENT
  }

  if (isUnendorsed) {
    if (isEligibleNow) {
      return XAppStatus.UNENDORSED_AND_ELIGIBLE
    }
    return XAppStatus.UNENDORSED_NOT_ELIGIBLE
  }

  if (score >= threshold) {
    if (isEligibleNow) {
      return XAppStatus.ENDORSED_AND_ELIGIBLE
    }
    return XAppStatus.ENDORSED_NOT_ELIGIBLE
  } // CHECK not sure if it is possible to differentiate between the two cases above

  return XAppStatus.UNKNOWN
}

/**
 * Hook to get the current app endorsement status
 * @returns {Object} An object containing the following properties:
 * - `threshold`: The endorsement score threshold
 * - `score`: The current endorsement score of the app
 * - `status`: The computed endorsement status
 * - `isLoading`: A boolean indicating if any of the data fetching operations are still in progress
 */
export const useAppEndorsementStatus = (appId: string) => {
  const { data: threshold, isLoading: isEndorsementThresholdLoading } = useEndorsementScoreThreshold()
  const { data: score, isLoading: isEndorsementScoreLoading } = useAppEndorsementScore(appId)
  const { data: isEligibleNow, isLoading: isEligibleNowLoading } = useIsAppEligibleNow(appId)
  const { data: isUnendorsed, isLoading: isUnendorsedLoading } = useIsAppUnendorsed(appId)
  const { data: isBlacklisted, isLoading: isBlacklistedLoading } = useAppIsBlacklisted(appId)
  const { data: appHasBeenIntoAllocationRounds, isLoading: isAppExistsLoading } = useAppExists(appId)

  const isLoading =
    isEndorsementThresholdLoading ||
    isEndorsementScoreLoading ||
    isEligibleNowLoading ||
    isUnendorsedLoading ||
    isBlacklistedLoading ||
    isAppExistsLoading

  const status = determineAppStatus(
    isUnendorsed,
    isEligibleNow,
    isBlacklisted,
    appHasBeenIntoAllocationRounds,
    Number(score),
    Number(threshold),
  )

  return {
    threshold,
    score,
    status,
    isLoading,
  }
}
