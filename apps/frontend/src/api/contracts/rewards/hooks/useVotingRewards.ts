import { useQueries } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { getRoundReward, getRoundRewardQueryKey } from "./useVotingRoundReward"

/**
 * useVotingRewards is a custom hook that fetches the voting rewards for a given round and voter.
 * It uses the useQueries hook from react-query to fetch the data in parallel for all rounds up to the current one.
 *
 * @param {string} currentRoundId - The id of the current round. If not provided, no queries will be made.
 * @param {string} voter - The address of the voter. If not provided, the rewards for all voters will be fetched.
 * @returns {object} An object containing the status and data of the queries. Refer to the react-query documentation for more details.
 */
export const useVotingRewards = (currentRoundId?: string, voter?: string) => {
  const { thor } = useConnex()

  // Get array from 1 to currentRoundId - 1 (if currentRoundId is still active)
  const rounds = useMemo(() => {
    return Array.from({ length: parseInt(currentRoundId ?? "0") - 1 }, (_, i) => (i + 1).toString())
  }, [currentRoundId])

  return useQueries({
    queries: rounds.map(roundId => ({
      queryKey: getRoundRewardQueryKey(roundId, voter),
      queryFn: async () => {
        const roundReward = await getRoundReward(thor, voter ?? "", roundId)

        return roundReward
      },
    })),
  })
}
