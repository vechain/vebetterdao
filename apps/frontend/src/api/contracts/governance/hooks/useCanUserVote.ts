import { useWallet } from "@vechain/dapp-kit-react"
import {
  useAllocationsRound,
  useAllocationsRoundState,
  useCurrentAllocationsRoundId,
  useHasVotedInRound,
} from "../../xAllocations"
import { useGetVotesOnBlock } from "./useVotesOnBlock"
import { useVotingThreshold } from "./useVotingThreshold"
import { useAllocationRoundSnapshot, useIsPersonAtTimepoint, useIsPerson } from "@/api"

/**
 * Hook to check if a user can vote in a round.
 * @returns The user's voting status including both current and snapshot state
 */
export const useCanUserVote = (user?: string, delegateeAddress?: string) => {
  const { account } = useWallet()
  const parsedAccount = user || account
  const { data: roundId } = useCurrentAllocationsRoundId()
  const { data: roundSnapshot, isLoading: roundSnapshotLoading } = useAllocationRoundSnapshot(roundId ?? "")
  const { data: state, isLoading: stateLoading } = useAllocationsRoundState(roundId)
  const { data: roundInfo } = useAllocationsRound(roundId)
  const { data: votesAtSnapshot, isLoading: votesAtSnapshotLoading } = useGetVotesOnBlock(
    Number(roundInfo.voteStart),
    parsedAccount ?? undefined,
  )
  const { data: threshold } = useVotingThreshold()
  const hasVotesAtSnapshot = Number(votesAtSnapshot) >= (threshold ?? 0)

  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(roundId, parsedAccount ?? undefined)
  const isVotingConcluded = [1, 2].includes(state ?? 0)

  // Get both snapshot and current status
  const { data: isPersonAtSnapshot, isLoading: isPersonAtSnapshotLoading } = useIsPersonAtTimepoint(
    delegateeAddress ?? parsedAccount,
    roundSnapshot,
  )
  const { data: isPersonNow, isLoading: isPersonNowLoading } = useIsPerson(delegateeAddress ?? parsedAccount)

  const canVote = !hasVoted && !isVotingConcluded && hasVotesAtSnapshot && isPersonAtSnapshot

  console.log({ isPersonAtSnapshot, isPersonNow, canVote, roundSnapshot })
  return {
    data: canVote,
    isLoading:
      hasVotedLoading ||
      stateLoading ||
      votesAtSnapshotLoading ||
      isPersonAtSnapshotLoading ||
      isPersonNowLoading ||
      roundSnapshotLoading,
    hasVotesAtSnapshot,
    isPersonAtSnapshot,
    isPersonNow,
  }
}
