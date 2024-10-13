import {
  SecurityLevel,
  useCurrentAllocationsRoundId,
  useGetCumulativeScoreWithDecay,
  useGetUserDelegator,
  useSecurityMultiplier,
  useThresholdParticipationScore,
} from "@/api/contracts"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"

/**
 * Hook to get the user's score percentage and if the user is qualified.
 * @returns The user's score percentage and if the user is qualified.
 */
export const useUserScore = (user?: string) => {
  const { account } = useWallet()
  const { data: scoreThreshold, isLoading: isScoreThresholdLoading } = useThresholdParticipationScore()
  const { data: roundId, isLoading: isRoundIdLoading } = useCurrentAllocationsRoundId()
  const { data: delegatorAddress, isLoading: isDelegatorLoading } = useGetUserDelegator()

  // this is the user's cumulative score with decay, we use that because it must be greater than the threshold
  const { data: userScore, isLoading: isUserRoundScoreLoading } = useGetCumulativeScoreWithDecay(
    // if the user is delegated, we use the delegator's address, otherwise we use the user's address
    user || delegatorAddress || account || "",
    Number(roundId),
  )

  const scorePercentage = useMemo(
    () => (Number(scoreThreshold) ? Math.min((Number(userScore || 0) / Number(scoreThreshold || 0)) * 100, 100) : 100),
    [userScore, scoreThreshold],
  )

  const isUserQualified = userScore >= scoreThreshold

  // we take the score of the easy actions as reference, as the minimum score of an action
  // so we can calculate the number of actions needed to reach the threshold at minimum
  const { data: easyActionScore, isLoading: isSecurityMultiplierLoading } = useSecurityMultiplier(SecurityLevel.LOW)
  const scoreNeeded = Math.max(Number(scoreThreshold ?? 0) - (Number(userScore ?? 0) ?? 0), 0)
  const missingActions = easyActionScore && scoreNeeded ? Math.ceil(scoreNeeded / easyActionScore) : 0

  return {
    isUserQualified,
    isUserDelegatee: !!delegatorAddress,
    scorePercentage,
    scoreThreshold,
    userScore,
    missingActions,
    isLoading:
      isScoreThresholdLoading ||
      isUserRoundScoreLoading ||
      isRoundIdLoading ||
      isDelegatorLoading ||
      isSecurityMultiplierLoading,
  }
}
