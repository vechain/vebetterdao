import { useCurrentAllocationsRoundId, useThresholdParticipationScore, useUserRoundScore } from "@/api/contracts"
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
  const { data: userScore, isLoading: isUserRoundScoreLoading } = useUserRoundScore(
    user || account || "",
    Number(roundId),
  )

  const scorePercentage = useMemo(
    () => (Number(scoreThreshold) ? Math.min((Number(userScore || 0) / Number(scoreThreshold || 0)) * 100, 100) : 100),
    [userScore, scoreThreshold],
  )

  const isUserQualified = userScore >= scoreThreshold

  return {
    isUserQualified,
    scorePercentage,
    scoreThreshold,
    userScore,
    isLoading: isScoreThresholdLoading || isUserRoundScoreLoading || isRoundIdLoading,
  }
}
