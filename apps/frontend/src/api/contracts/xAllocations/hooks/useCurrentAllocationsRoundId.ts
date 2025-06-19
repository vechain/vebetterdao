import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@repo/contracts"

const address = getConfig().xAllocationVotingContractAddress as `0x${string}`
const abi = XAllocationVoting__factory.abi
const method = "currentRoundId" as const

/**
 * Returns the query key for fetching the current allocations round ID.
 * @returns The query key for fetching the current allocations round ID.
 */
export const getCurrentAllocationsRoundIdQueryKey = () =>
  getCallClauseQueryKey<typeof abi>({ address, method, args: [] })

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
      select: data => data[0].$bigintString,
      staleTime: 0,
    },
  })
}
