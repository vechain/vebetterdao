import {
  useThresholdParticipationScore,
  useGetCurrentUserCumulativeScoreWithDecay,
  useSecurityMultiplier,
  SecurityLevel,
} from "@/api/contracts"
import { useSustainabilityCurrentUserOverview } from "./useSustainabilitySingleUserOverview"

export const useUserActions = () => {
  // we take the score of the easy actions as reference, as the minimum score of an action
  // so we can calculate the number of actions needed to reach the threshold at minimum
  const { data: easyActionScore, isLoading: isSecurityMultiplierLoading } = useSecurityMultiplier(SecurityLevel.LOW)

  const { data: userOverview, isLoading: isUserOverviewLoading } = useSustainabilityCurrentUserOverview()
  const { data: scoreThreshold, isLoading: isScoreThresholdLoading } = useThresholdParticipationScore()

  // this is the user's cumulative score with decay, we use that because it must be greater than the threshold
  const { data: userScore, isLoading: isUserRoundScoreLoading } = useGetCurrentUserCumulativeScoreWithDecay()

  // we show the round actions because it's impossible to calculate the number of actions for the decay period
  const userActions = userOverview?.actionsRewarded ?? 0
  const scoreNeeded = Math.max(Number(scoreThreshold ?? 0) - (Number(userScore ?? 0) ?? 0), 0)
  const missingActions = easyActionScore ? Math.ceil(scoreNeeded / easyActionScore) : 0

  const totalActions = userActions + missingActions

  return {
    userActions,
    missingActions,
    totalActions,
    isLoading:
      isUserOverviewLoading || isScoreThresholdLoading || isUserRoundScoreLoading || isSecurityMultiplierLoading,
  }
}
