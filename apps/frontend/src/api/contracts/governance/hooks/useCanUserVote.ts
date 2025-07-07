import { useWallet } from "@vechain/vechain-kit"
import {
  useAllocationsRound,
  useAllocationsRoundState,
  useCurrentAllocationsRoundId,
  useHasVotedInRound,
} from "../../xAllocations"
import { useGetVotesOnBlock } from "./useVotesOnBlock"
import { useVotingThreshold } from "./useVotingThreshold"
import { useAllocationRoundSnapshot, useIsPersonAtTimepoint } from "@/api"

/**
 * Hook to check if a user can vote in a round.
 * @returns The user's voting status.
 */
export const useCanUserVote = (user?: string, delegateeAddress?: string) => {
  const { account } = useWallet()
  const parsedAccount = user ?? account?.address
  const { data: roundId } = useCurrentAllocationsRoundId()
  const { data: roundSnapshot, isLoading: roundSnapshotLoading } = useAllocationRoundSnapshot(roundId ?? "")
  const { data: state, isLoading: stateLoading } = useAllocationsRoundState(roundId)
  const { data: roundInfo } = useAllocationsRound(roundId)
  const { data: votesAtSnapshot, isLoading: votesAtSnapshotLoading } = useGetVotesOnBlock(
    roundInfo.voteStart ? Number(roundInfo.voteStart) : undefined,
    parsedAccount ?? undefined,
  )
  const { data: threshold } = useVotingThreshold()
  const hasVotesAtSnapshot = Number(votesAtSnapshot) >= (Number(threshold) ?? 0)

  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(roundId, parsedAccount ?? undefined)
  const isVotingConcluded = [1, 2].includes(state ?? 0)
  const { data: isPerson = false, isLoading: isPersonLoading } = useIsPersonAtTimepoint(
    delegateeAddress ?? parsedAccount,
    roundSnapshot,
  )

  return {
    data: !hasVoted && !isVotingConcluded && hasVotesAtSnapshot && isPerson,
    isLoading: hasVotedLoading || stateLoading || votesAtSnapshotLoading || isPersonLoading || roundSnapshotLoading,
    hasVotesAtSnapshot,
    snapshotBlock: Number(roundInfo.voteStart),
    isPerson,
  }
}
