import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const address = getConfig().xAllocationVotingContractAddress as `0x${string}`
const abi = XAllocationVoting__factory.abi
const method = "currentRoundId" as const
/**
 * Returns the query key for fetching the current allocations round ID.
 * @returns The query key for fetching the current allocations round ID.
 */
export const getCurrentAllocationsRoundIdQueryKey = () => getCallClauseQueryKey({ abi, address, method })
/**
 * Hook to get the current roundId of allocations voting
 * @returns the current roundId of allocations voting
 */
export const useCurrentAllocationsRoundId = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data => data[0].toString(),
      staleTime: 0,
    },
  })
}
