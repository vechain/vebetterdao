import { getConfig } from "@repo/config"
import { VOT3__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { ethers } from "ethers"

const abi = VOT3__factory.abi
const address = getConfig().vot3ContractAddress
const method = "getPastTotalSupply" as const
export const getVot3PastTotalSupplyQueryKey = (timepoint: number) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [BigInt(timepoint)],
  })
/**
 *  Hook to get the total supply of VOT3 at a given timepoint (in the past)
 * @param timepoint  The timepoint to get the total supply at (block)
 * @returns  the total supply of VOT3 at the given timepoint
 */
export const useVot3PastSupply = (timepoint?: number | string, enabled = true) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(timepoint || 0)],
    queryOptions: {
      enabled: !!timepoint && enabled,
      select: data => ethers.formatEther(data[0]),
    },
  })
}
