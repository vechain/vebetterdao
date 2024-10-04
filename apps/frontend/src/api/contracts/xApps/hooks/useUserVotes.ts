import { useQueries } from "@tanstack/react-query"
import { useMemo } from "react"
import { getUserVotesInRound, getUserVotesInRoundQueryKey } from "."
import { useConnex } from "@vechain/dapp-kit-react"

/**
 * useUserVotes is a custom hook that fetches the votes of a user for all rounds up to the current one.
 * @param currentRound - The id of the current round.
 * @param address - The address of the user.
 * @returns An object containing the status and data of the queries for each round.
 */
export const useUserVotes = (currentRound?: string, address?: string) => {
  const { thor } = useConnex()

  // From 1 to currentRound
  const roundIds = useMemo(() => {
    try {
      if (currentRound && parseInt(currentRound) > 0) {
        return Array.from({ length: parseInt(currentRound) }, (_, i) => (i + 1).toString())
      }
      return []
    } catch (e) {
      console.error(e)
      return []
    }
  }, [currentRound])

  return useQueries({
    queries: roundIds.map(roundId => ({
      queryKey: getUserVotesInRoundQueryKey(roundId.toString(), address),
      queryFn: async () => {
        return getUserVotesInRound(thor, roundId.toString(), address)
      },
    })),
  })
}
