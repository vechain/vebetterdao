import { useThor } from "@vechain/vechain-kit"
import { useQueries } from "@tanstack/react-query"
import { getHasVotedInRoundQueryKey, getHasVotedInRound } from "./useHasVotedInRound"

/**
 *  Hook to get the latest roundId the user have voted on
 * @param totalRounds is the length of total rounds from currentId to 1.
 * @param address  the address to check if they have voted
 * @returns the latest voted roundId
 */
export const useLatestVotingRound = (totalRounds: string, voter: string) => {
  const thor = useThor()
  const _totalRounds = Number(totalRounds)

  // Creates array from totalRounds to 1
  const rounds = Array.from({ length: _totalRounds }, (_, i) => (_totalRounds - i).toString())
  const queries = useQueries({
    queries: rounds.map(roundId => ({
      queryKey: getHasVotedInRoundQueryKey(roundId, voter),
      queryFn: async () => await getHasVotedInRound(thor, roundId, voter),
      enabled: !!thor && !!roundId && !!voter,
    })),
  })

  const isLoading = queries.some(query => query.isLoading)
  const error = queries.find(query => query.error)?.error

  // Finds the latest round where the user has voted
  const latestVotedRound = rounds.find((_round, index) => queries[index]?.data === true) ?? ""

  return {
    roundId: latestVotedRound,
    isLoading: isLoading,
    error: error,
  }
}
