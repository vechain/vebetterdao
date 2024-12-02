import {
  useCurrentAllocationsRoundDeadline,
  useCurrentAllocationsRoundId,
  useGracePeriodEvent,
  useVotingPeriod,
} from "@/api"

/**
 * This hook calculates the allocation round by which an app's grace period will end.
 *
 * @param appId - The ID of the app to check
 * @returns { roundId: number | undefined; isLoading: boolean } - The allocation round ID and loading state
 */
export const useAppGracePeriodEndsAfterRound = (appId: string) => {
  // Retrieve environment and contract configuration
  const { data: votingPeriod, isLoading: isVotingPeriodLoading } = useVotingPeriod()
  const EMISSIONS_CYCLE_DURATION = Number(votingPeriod)

  // Load necessary data for determining grace period and round information
  const { data: gracePeriodEvents, isLoading: gracePeriodEventsLoading } = useGracePeriodEvent(appId)
  const { data: currentRoundDeadline, isLoading: currentRoundDeadlineLoading } = useCurrentAllocationsRoundDeadline()
  const { data: currentRoundId, isLoading: currentRoundIdLoading } = useCurrentAllocationsRoundId()

  // Extract relevant block numbers
  const gracePeriodEndingBlockNum = Number(gracePeriodEvents?.[0]?.endBlock)
  const currentRoundEndingBlockNum = Number(currentRoundDeadline)
  const currentRoundIdNum = Number(currentRoundId)

  // Determine if the hook is in a loading state
  const isLoading =
    gracePeriodEventsLoading || currentRoundDeadlineLoading || currentRoundIdLoading || isVotingPeriodLoading

  // Early return if essential data is missing or still loading
  if (
    isNaN(EMISSIONS_CYCLE_DURATION) ||
    isNaN(gracePeriodEndingBlockNum) ||
    isNaN(currentRoundEndingBlockNum) ||
    isNaN(currentRoundIdNum) ||
    isLoading
  ) {
    return { roundId: undefined, isLoading }
  }

  // Calculate the latest round by which grace period ends
  let roundId = -1 // Defaults to -1 if the grace period extends beyond foreseeable rounds
  let isCurrentRound = false
  let isNextRound = false

  // Check if grace period ends within the current round, next round, or the round after
  if (gracePeriodEndingBlockNum < currentRoundEndingBlockNum) {
    roundId = currentRoundIdNum
    isCurrentRound = true
  } else if (gracePeriodEndingBlockNum < currentRoundEndingBlockNum + EMISSIONS_CYCLE_DURATION) {
    roundId = currentRoundIdNum + 1
    isNextRound = true
  } else if (gracePeriodEndingBlockNum < currentRoundEndingBlockNum + EMISSIONS_CYCLE_DURATION * 2) {
    roundId = currentRoundIdNum + 2
  }

  return { roundId, isLoading, isCurrentRound, isNextRound }
}
