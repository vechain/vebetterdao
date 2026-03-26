// Getter for obtaining appIds of a given round
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/x-allocation-voting-governance/XAllocationVoting__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
const address = getConfig().xAllocationVotingContractAddress
const abi = XAllocationVoting__factory.abi
const method = "getAppIdsOfRound" as const
/**
 * Returns the query key for fetching app IDs of a round.
 * @param roundId The round ID to get app IDs for
 * @returns The query key for fetching app IDs of a round.
 */
export const getAppIdsOfRoundQueryKey = (roundId?: number) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(roundId || 0)] })
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
      select: data => data[0],
    },
  })
}
