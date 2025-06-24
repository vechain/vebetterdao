import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@repo/contracts"
import { formatEther } from "viem"

const address = getConfig().xAllocationPoolContractAddress as `0x${string}`
const abi = XAllocationPool__factory.abi
const method = "baseAllocationAmount" as const

/**
 * Returns the query key for fetching the allocation base amount.
 * @param roundId The round ID to get the base amount for
 * @returns The query key for fetching the allocation base amount.
 */
export const getAllocationBaseAmountQueryKey = (roundId?: number) => {
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(roundId || 0)] })
}

/**
 * Hook to get the base xDapps allocation amount for a given roundId
 * @param roundId The roundId to get the base allocation for
 * @returns the base allocation for xDapps for a given roundId
 */
export const useAllocationBaseAmount = (roundId?: string) => {
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
