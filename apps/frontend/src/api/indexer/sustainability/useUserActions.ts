import { useSecurityMultiplier, SecurityLevel } from "@/api/contracts"
import { useUserScore } from "./useUserScore"

/**
 * Hook to get the number of missing actions to reach the threshold.
 * @returns The number of missing actions and if the user is loading.
 */
export const useUserActions = () => {
  // we take the score of the easy actions as reference, as the minimum score of an action
  // so we can calculate the number of actions needed to reach the threshold at minimum
  const { data: easyActionScore, isLoading: isSecurityMultiplierLoading } = useSecurityMultiplier(SecurityLevel.LOW)
  const { userScore, scoreThreshold, isLoading: isUserScoreLoading } = useUserScore()

  const scoreNeeded = Math.max(Number(scoreThreshold ?? 0) - (Number(userScore ?? 0) ?? 0), 0)
  const missingActions = easyActionScore && scoreNeeded ? Math.ceil(scoreNeeded / easyActionScore) : 0

  return {
    missingActions,
    isLoading: isUserScoreLoading || isSecurityMultiplierLoading,
  }
}
