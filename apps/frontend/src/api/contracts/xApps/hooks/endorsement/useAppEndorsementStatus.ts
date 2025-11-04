import { XAppStatus } from "../../../../../types/appDetails"
import { useAppExists } from "../useAppExists"
import { useAppIsBlackListed } from "../useAppIsBlackListed"
import { useEndorsementScoreThreshold } from "../useEndorsementScoreThreshold"

import { useAppEligibleAtRoundStart } from "./useAppEligibleAtRoundStart"
import { useAppEndorsementScore } from "./useAppEndorsementScore"
import { useIsAppUnendorsed } from "./useIsAppUnendorsed"

/**
 * Determine the current app endorsement status
 * @param isUnendorsed Whether the app is unendorsed
 * @param appEligibleAtRoundStart Whether the app was eligible at the start of the current allocation round
 * @param isBlacklisted Whether the app is blacklisted
 * @param appHasBeenIntoAllocationRounds Whether the app has been into allocation rounds
 * @param score The app endorsement score
 * @param threshold The endorsement score threshold
 * @returns The current app endorsement status
 */
const determineAppStatus = (
  isUnendorsed: boolean | undefined,
  appEligibleAtRoundStart: boolean | undefined,
  isBlacklisted: boolean | undefined,
  appHasBeenIntoAllocationRounds: boolean | undefined,
  score: number,
  threshold: number,
) => {
  if (
    typeof isUnendorsed === "undefined" ||
    typeof appEligibleAtRoundStart === "undefined" ||
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
    if (appEligibleAtRoundStart) {
      return XAppStatus.UNENDORSED_AND_ELIGIBLE
    }
    return XAppStatus.UNENDORSED_NOT_ELIGIBLE
  }

  if (score >= threshold) {
    return XAppStatus.ENDORSED_AND_ELIGIBLE
  }

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
  const {
    data: threshold,
    isLoading: isEndorsementThresholdLoading,
    isFetching: isFetchingThreshold,
  } = useEndorsementScoreThreshold()
  const {
    data: score,
    isLoading: isEndorsementScoreLoading,
    isFetching: isFetchingScore,
  } = useAppEndorsementScore(appId)
  const {
    data: appEligibleAtRoundStart,
    isLoading: isAppEligibleAtRoundStartLoading,
    isFetching: isFetchingAppEligible,
  } = useAppEligibleAtRoundStart(appId)
  const {
    data: isUnendorsed,
    isLoading: isUnendorsedLoading,
    isFetching: isFetchingUnendorsed,
  } = useIsAppUnendorsed(appId)
  const {
    data: isBlacklisted = false,
    isLoading: isBlacklistedLoading,
    isFetching: isFetchingBlacklisted,
  } = useAppIsBlackListed(appId)
  const {
    data: appHasBeenIntoAllocationRounds,
    isLoading: isAppExistsLoading,
    isFetching: isFetchingAppExists,
  } = useAppExists(appId)

  const numericScore = Number(score)
  const numericThreshold = Number(threshold)

  // Check if we're still loading OR if we don't have valid data yet
  const hasValidData =
    typeof isUnendorsed !== "undefined" &&
    typeof appEligibleAtRoundStart !== "undefined" &&
    typeof isBlacklisted !== "undefined" &&
    typeof appHasBeenIntoAllocationRounds !== "undefined" &&
    !isNaN(numericScore) &&
    !isNaN(numericThreshold)

  const isLoading =
    isEndorsementThresholdLoading ||
    isFetchingThreshold ||
    isEndorsementScoreLoading ||
    isFetchingScore ||
    isAppEligibleAtRoundStartLoading ||
    isFetchingAppEligible ||
    isUnendorsedLoading ||
    isFetchingUnendorsed ||
    isBlacklistedLoading ||
    isFetchingBlacklisted ||
    isAppExistsLoading ||
    isFetchingAppExists ||
    !hasValidData

  const status = determineAppStatus(
    isUnendorsed,
    appEligibleAtRoundStart,
    isBlacklisted,
    appHasBeenIntoAllocationRounds,
    numericScore,
    numericThreshold,
  )

  return {
    threshold,
    score,
    status,
    isLoading,
  }
}
