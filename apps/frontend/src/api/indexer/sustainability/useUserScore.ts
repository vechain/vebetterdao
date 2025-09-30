// TODO: idk if this is indexer related
// can/should be deleted/moved after investigation
import {
  SecurityLevel,
  useCurrentAllocationsRoundId,
  useGetCumulativeScoreWithDecay,
  useGetDelegator,
  useSecurityMultiplier,
  useThresholdParticipationScoreAtTimepoint,
} from "@/api/contracts"
import { useAllocationRoundSnapshot } from "@/api"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

/**
 * Hook to get the user's score percentage and if the user is qualified.
 * @returns The user's score percentage and if the user is qualified.
 */
export const useUserScore = (user?: string) => {
  const { account } = useWallet()
  const { data: roundId, isLoading: isRoundIdLoading } = useCurrentAllocationsRoundId()
  const { data: roundSnapshot, isLoading: isRoundSnapshotLoading } = useAllocationRoundSnapshot(roundId ?? "")
  const { data: scoreThresholdAtRoundStart, isLoading: isScoreThresholdAtRoundStartLoading } =
    useThresholdParticipationScoreAtTimepoint(roundSnapshot ?? "")
  const { data: delegatorAddress, isLoading: isDelegatorLoading } = useGetDelegator(user)

  // this is the user's cumulative score with decay, we use that because it must be greater than the threshold
  const { data: userScore, isLoading: isUserRoundScoreLoading } = useGetCumulativeScoreWithDecay(
    // if the user is delegated, we use the delegator's address, otherwise we use the user's address
    delegatorAddress ?? user ?? account?.address ?? "",
    roundId ? Number(roundId) : undefined,
  )

  const scorePercentage = useMemo(
    () =>
      Number(scoreThresholdAtRoundStart ?? 0)
        ? Math.min((Number(userScore ?? 0) / Number(scoreThresholdAtRoundStart ?? 0)) * 100, 100)
        : 100,
    [userScore, scoreThresholdAtRoundStart],
  )

  // we take the score of the easy actions as reference, as the minimum score of an action
  // so we can calculate the number of actions needed to reach the threshold at minimum
  const { data: easyActionScore, isLoading: isSecurityMultiplierLoading } = useSecurityMultiplier(SecurityLevel.LOW)
  const scoreNeeded = Math.max(Number(scoreThresholdAtRoundStart ?? 0) - Number(userScore ?? 0), 0)
  const missingActions =
    Number(easyActionScore ?? 0) && scoreNeeded ? Math.ceil(scoreNeeded / Number(easyActionScore ?? 0)) : 0

  return {
    isUserDelegatee: !!delegatorAddress,
    delegatorAddress,
    scorePercentage,
    scoreThresholdAtRoundStart,
    userScore,
    missingActions,
    isLoading:
      isScoreThresholdAtRoundStartLoading ||
      isUserRoundScoreLoading ||
      isRoundIdLoading ||
      isDelegatorLoading ||
      isSecurityMultiplierLoading ||
      isRoundSnapshotLoading,
  }
}
