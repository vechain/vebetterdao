import { useHasVotedInRound } from "../../xAllocations/hooks/useHasVotedInRound"

export const FindUserVotedInRound = (roundId: string, voter?: string) => {
  const { data: hasVoted } = useHasVotedInRound(roundId, voter ?? undefined)
  return hasVoted ? roundId : undefined
}
