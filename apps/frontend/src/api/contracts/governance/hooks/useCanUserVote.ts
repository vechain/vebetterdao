import { useWallet } from "@vechain/dapp-kit-react"
import {
  useAllocationsRound,
  useAllocationsRoundState,
  useCurrentAllocationsRoundId,
  useHasVotedInRound,
} from "../../xAllocations"
import { useGetVotesOnBlock } from "./useVotesOnBlock"
import { useVotingThreshold } from "./useVotingThreshold"
import { useIsUserPerson } from "../../vePassport"

/**
 * Hook to check if a user can vote in a round.
 * @returns The user's voting status.
 */
export const useCanUserVote = () => {
  const { account } = useWallet()
  const { data: roundId } = useCurrentAllocationsRoundId()
  const { data: state, isLoading: stateLoading } = useAllocationsRoundState(roundId)
  const { data: roundInfo } = useAllocationsRound(roundId)
  const { data: votesAtSnapshot, isLoading: votesAtSnapshotLoading } = useGetVotesOnBlock(
    Number(roundInfo.voteStart),
    account ?? undefined,
  )
  const { data: threshold } = useVotingThreshold()
  const hasVotesAtSnapshot = Number(votesAtSnapshot) >= (threshold ?? 0)

  const { data: hasVoted, isLoading: hasVotedLoading } = useHasVotedInRound(roundId, account ?? undefined)
  const isVotingConcluded = [1, 2].includes(state ?? 0)
  const { data: isPerson, isLoading: isPersonLoading } = useIsUserPerson()

  return {
    data: !hasVoted && !isVotingConcluded && hasVotesAtSnapshot && isPerson,
    isLoading: hasVotedLoading || stateLoading || votesAtSnapshotLoading || isPersonLoading,
  }
}
