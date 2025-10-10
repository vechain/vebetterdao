import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { formatEther } from "viem"

const address = getConfig().xAllocationPoolContractAddress
const abi = XAllocationPool__factory.abi
const method = "getMaxAppAllocation" as const
/**
 * Returns the query key for fetching the max allocation amount.
 * @param roundId The round ID to get the max allocation amount for
 * @returns The query key for fetching the max allocation amount.
 */
export const getMaxAllocationAmountQueryKey = (roundId?: number) => {
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(roundId || 0)] })
}
/**
 * Hook to get the max xDapps allocation amount for a given roundId
 * @param roundId The roundId to get the base allocation for
 * @returns the max allocation for xDapps for a given roundId
 */
export const useMaxAllocationAmount = (roundId?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(roundId || 0)],
    queryOptions: {
      enabled: !!roundId,
      select: data => formatEther(BigInt(data[0])),
    },
  })
}
