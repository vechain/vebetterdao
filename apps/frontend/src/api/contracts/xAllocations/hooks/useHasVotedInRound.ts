import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@repo/contracts"

const address = getConfig().xAllocationVotingContractAddress
const abi = XAllocationVoting__factory.abi
const method = "hasVoted" as const

/**
 * Returns the query key for fetching if a user has voted in a round.
 * @param roundId The round ID to check
 * @param userAddress The user address to check if they have voted
 * @returns The query key for fetching if a user has voted in a round.
 */
export const getHasVotedInRoundQueryKey = (roundId: string, userAddress?: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [BigInt(roundId), userAddress as `0x${string}`],
  })

/**
 * Hook to get if a user has voted in a given roundId
 * @param roundId The roundId to get the votes for
 * @param userAddress The address to check if they have voted
 * @returns if a user has voted in a given roundId
 */
export const useHasVotedInRound = (roundId?: string, userAddress?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(roundId || 0), (userAddress || "") as `0x${string}`],
    queryOptions: {
      enabled: !!roundId && !!userAddress,
      select: data => data[0],
    },
  })
}
