import { getConfig } from "@repo/config"
import { DBAPool__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { getCallClauseQueryKey, useCallClause } from "@vechain/vechain-kit"

const abi = DBAPool__factory.abi
const address = getConfig().dbaPoolContractAddress as `0x${string}`
const method = "distributionStartRound" as const

/**
 * Returns the query key for fetching the DBA distribution start round
 */
export const getDBADistributionStartRoundQueryKey = () =>
  getCallClauseQueryKey<typeof abi>({ address, method, args: [] })

/**
 * Hook to get the round from which DBA distribution starts
 * This value is cached forever as it's a constant from the contract
 * @returns The distribution start round number
 */
export const useDBADistributionStartRound = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data => Number(data[0]),
      staleTime: Infinity, // Cache forever - this value never changes
      gcTime: Infinity, // Keep in cache forever
    },
  })
}
