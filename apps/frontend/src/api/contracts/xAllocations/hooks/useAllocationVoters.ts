import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@repo/contracts"

const address = getConfig().xAllocationVotingContractAddress
const abi = XAllocationVoting__factory.abi
const method = "totalVoters" as const

/**
 * Returns the query key for fetching the allocation voters.
 * @param roundId The round ID to get the voters for
 * @returns The query key for fetching the allocation voters.
 */
export const getAllocationVotersQueryKey = (roundId?: string) =>
  getCallClauseQueryKey<typeof abi>({ address, method, args: [BigInt(roundId || 0)] })

/**
 * Hook to get the number of voters for a given roundId
 * @param roundId The roundId to get the votes for
 * @returns the number of voters for a given roundId
 */
export const useAllocationVoters = (roundId?: string) => {
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
