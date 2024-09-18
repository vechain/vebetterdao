import { useAppEndorsementScore, useEndorsementScoreThreshold } from "@/api"
import { EndorsementStatus } from "@/types"
import dayjs from "dayjs"
import { useParams } from "next/navigation"

/**
 * Determine the endorsement status of the current app.
 * @param score The endorsement score of the current app.
 * @param threshold The endorsement threshold of the current app.
 * @param maxDate The maximum date for endorsement.
 * @returns The endorsement status of the current app.
 */
const determineStatus = (score?: number, threshold?: number, maxDate?: dayjs.ConfigType) => {
  //Fallback to pending if any of the required values are missing
  if (!score || !threshold || !maxDate) {
    return EndorsementStatus.PENDING
  }

  const endorsementFailed = score < threshold && dayjs().isAfter(maxDate)

  if (endorsementFailed) {
    return EndorsementStatus.LOST
  }
  if (score >= threshold) {
    return EndorsementStatus.SUCCESS
  }

  //Fallback to pending if any condition fails
  return EndorsementStatus.PENDING
}

/**
 * Custom hook to fetch and manage the current app's endorsement status.
 * @returns An object containing the endorsement threshold, endorsement score, loading state, and error state.
 */
export const useCurrentAppEndorsementStatus = () => {
  const { appId } = useParams<{ appId: string }>()
  const { data: threshold, isLoading: isEndorsementThresholdLoading } = useEndorsementScoreThreshold()
  const { data: score, isLoading: isEndorsementScoreLoading } = useAppEndorsementScore(appId)

  //TODO: Calculate max date based on the grace period
  // const { data: gracePeriod } = useEndorsementGracePeriod()
  const maxDate = dayjs().add(1, "hour")

  const status = determineStatus(Number(score), Number(threshold), maxDate)
  return {
    threshold,
    score,
    status,
    maxDate,
    isLoading: isEndorsementThresholdLoading || isEndorsementScoreLoading,
  }
}
