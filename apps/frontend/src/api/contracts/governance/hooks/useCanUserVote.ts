import { useWallet } from "@vechain/dapp-kit-react"
import {
  useAllocationsRound,
  useAllocationsRoundState,
  useCurrentAllocationsRoundId,
  useHasVotedInRound,
} from "../../xAllocations"
import { useGetVotesOnBlock } from "./useVotesOnBlock"
import { useVotingThreshold } from "./useVotingThreshold"
import {
  useAllocationRoundSnapshot,
  useIsPersonAtTimepoint,
  useIsPerson,
  useIsEntityInTimepoint,
  useIsEntity,
} from "@/api"

type CanUserVoteResult = {
  data: boolean
  isLoading: boolean
  hasVotesAtSnapshot: boolean
  snapshotBlock: number
  isPersonAtSnapshot: boolean
  isPersonAtSnapshotReason: string
  isPersonNow: boolean
  isEntity: boolean
  isEntityAtSnapshot: boolean
}

/**
 * Hook to check if a user can vote in a round.
 * @param user - Optional user address to check. If not provided, uses connected wallet
 * @param delegateeAddress - Optional delegatee address to check instead of user
 * @returns The user's voting status including both current and snapshot state
 */
export const useCanUserVote = (user?: string, delegateeAddress?: string): CanUserVoteResult => {
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

  // Get both at snapshot and current status
  const { data: isPersonAtSnapshotResult, isLoading: isPersonAtSnapshotLoading } = useIsPersonAtTimepoint(
    delegateeAddress ?? parsedAccount ?? "",
    roundSnapshot,
  )
  const { data: isPersonNow, isLoading: isPersonNowLoading } = useIsPerson(delegateeAddress ?? parsedAccount)
  const { data: isEntity, isLoading: isEntityLoading } = useIsEntity(delegateeAddress ?? parsedAccount)
  const { data: isEntityAtSnapshot, isLoading: isEntityAtSnapshotLoading } = useIsEntityInTimepoint(
    delegateeAddress ?? parsedAccount,
    roundSnapshot,
  )

  const isPersonAtSnapshot = isPersonAtSnapshotResult?.isPersonAtTimepoint ?? false
  const isPersonAtSnapshotReason = isPersonAtSnapshotResult?.reason ?? ""

  const canVote = !hasVoted && !isVotingConcluded && hasVotesAtSnapshot && isPersonAtSnapshot

  return {
    data: canVote,
    isLoading:
      hasVotedLoading ||
      stateLoading ||
      votesAtSnapshotLoading ||
      isPersonAtSnapshotLoading ||
      isPersonNowLoading ||
      roundSnapshotLoading ||
      isEntityLoading ||
      isEntityAtSnapshotLoading,
    hasVotesAtSnapshot,
    snapshotBlock: Number(roundInfo.voteStart),
    isPersonAtSnapshot,
    isPersonAtSnapshotReason,
    isPersonNow,
    isEntity,
    isEntityAtSnapshot,
  }
}
