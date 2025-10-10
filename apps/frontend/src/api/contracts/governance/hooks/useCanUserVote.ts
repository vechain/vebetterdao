import { useWallet } from "@vechain/vechain-kit"

import { useIsPersonAtTimepoint } from "../../vePassport/hooks/useIsPersonAtTimepoint"
import { useAllocationRoundSnapshot } from "../../xAllocations/hooks/useAllocationRoundSnapshot"
import { useAllocationsRound } from "../../xAllocations/hooks/useAllocationsRound"
import { useAllocationsRoundState } from "../../xAllocations/hooks/useAllocationsRoundState"
import { useCurrentAllocationsRoundId } from "../../xAllocations/hooks/useCurrentAllocationsRoundId"
import { useHasVotedInRound } from "../../xAllocations/hooks/useHasVotedInRound"

import { useTotalVotesOnBlock } from "./useTotalVotesOnBlock"
import { useVotingThreshold } from "./useVotingThreshold"

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
  const totalVotesAtSnapshotQuery = useTotalVotesOnBlock(
    roundInfo.voteStart ? Number(roundInfo.voteStart) : undefined,
    account?.address ?? "",
  )
  const votesAtSnapshot = totalVotesAtSnapshotQuery.data?.totalVotesWithDeposits
  const votesAtSnapshotLoading = totalVotesAtSnapshotQuery.isLoading
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
