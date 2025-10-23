import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().xAllocationVotingContractAddress
const abi = XAllocationVoting__factory.abi
const method = "isUserAutoVotingEnabledForRound" as const

/**
 * Returns the query key for fetching if auto-voting is enabled for a user in a specific round.
 * @param userAddress The user address to check
 * @param roundId The round ID to check
 * @returns The query key for fetching if auto-voting is enabled for the round
 */
export const getIsAutoVotingEnabledForRoundQueryKey = (userAddress?: string, roundId?: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [userAddress as `0x${string}`, roundId ? BigInt(roundId) : BigInt(0)],
  })

/**
 * Hook to check if auto-voting is enabled for a user at the start of a specific round.
 * This checks if auto-voting was enabled at the round's snapshot.
 * @param userAddress The address to check if auto-voting is enabled for the round
 * @param roundId The round ID to check
 * @returns Boolean indicating if auto-voting is enabled for the user in the specific round
 */
export const useIsAutoVotingEnabledForRound = (userAddress?: string, roundId?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [(userAddress || "") as `0x${string}`, roundId ? BigInt(roundId) : BigInt(0)],
    queryOptions: {
      enabled: !!userAddress && !!roundId,
      select: data => data[0],
    },
  })
}
