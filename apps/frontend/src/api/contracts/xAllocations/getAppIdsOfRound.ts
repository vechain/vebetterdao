// Getter for obtaining appIds of a given round

import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@repo/contracts"

const address = getConfig().xAllocationVotingContractAddress
const abi = XAllocationVoting__factory.abi
const method = "getAppIdsOfRound" as const

/**
 * Returns the query key for fetching app IDs of a round.
 * @param roundId The round ID to get app IDs for
 * @returns The query key for fetching app IDs of a round.
 */
export const getAppIdsOfRoundQueryKey = (roundId?: string) =>
  getCallClauseQueryKey<typeof abi>({ address, method, args: [BigInt(roundId || 0)] })

/**
 * Hook to get the appIds participating in allocations for a given round
 * @param roundId The roundId to get app IDs for
 * @returns The appIds of the given round
 */
export const useAppIdsOfRound = (roundId?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(roundId || 0)],
    queryOptions: {
      enabled: !!roundId,
      select: data => data[0] as string[],
    },
  })
}
