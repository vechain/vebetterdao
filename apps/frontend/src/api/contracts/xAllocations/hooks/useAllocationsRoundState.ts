import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@repo/contracts/typechain-types"

const address = getConfig().xAllocationVotingContractAddress
const abi = XAllocationVoting__factory.abi
const method = "state" as const

export const RoundState = {
  0: "Active",
  1: "Failed",
  2: "Succeeded",
}

/**
 * Returns the query key for fetching the allocations round state.
 * @param roundId The round ID to get the state for
 * @returns The query key for fetching the allocations round state.
 */
export const getAllocationsRoundStateQueryKey = (roundId?: string) =>
  getCallClauseQueryKey<typeof abi>({ address, method, args: [BigInt(roundId || 0)] })

/**
 * Hook to get the state of a given roundId
 * @param roundId The roundId to get state for
 * @returns the state of a given roundId
 */
export const useAllocationsRoundState = (roundId?: string) => {
  console.log("aal", roundId)
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(roundId || 0)],
    queryOptions: {
      enabled: !!roundId,
      select: data => Number(data[0]) as keyof typeof RoundState,
    },
  })
}
