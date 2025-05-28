import { VoterRewards__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { formatEther } from "viem"

const method = "cycleToTotal" as const
const abi = VoterRewards__factory.abi
const address = getConfig().voterRewardsContractAddress

/**
 * Returns the query key for fetching the getCycleToTotal
 * * @param {string} cycle - The id of the round.
 * @returns The query key for fetching the getCycleToTotal
 */
export const getCycleToTotal = (cycle?: string) => {
  return getCallClauseQueryKey<typeof abi>({ address, method, args: [BigInt(cycle ?? "0")] })
}

/**
 * Hook that fetches the total reward-weighted votes given a specific cycle(round)
 *
 * @param {string} cycle - The id of the round. If not provided, no queries will be made.
 * @returns {uint256} A uint256 that represents the total reward-weighted votes in a specific cycle.
 */
export const useCycleToTotal = (cycle?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(cycle ?? "0")],
    queryOptions: {
      enabled: !!cycle,
      select: data => formatEther(data[0]),
    },
  })
}
