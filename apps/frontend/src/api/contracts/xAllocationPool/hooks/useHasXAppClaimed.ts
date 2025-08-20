import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@vechain-kit/vebetterdao-contracts"

const abi = XAllocationPool__factory.abi
const address = getConfig().xAllocationPoolContractAddress
const method = "claimed" as const

export const getHasXAppClaimedQueryKey = (roundId: string, appId: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [BigInt(roundId), appId as `0x${string}`],
  })

/**
 *  Check if user has already claimed allocation rewards for a specific round and xApp
 *
 * @param thor  the thor client
 * @param roundId  the round id
 * @param xAppId  the xApp id
 * @returns if user has already claimed allocation rewards for a specific round and xApp
 */
export const useHasXAppClaimed = (roundId: string, xAppId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(roundId), xAppId as `0x${string}`],
    queryOptions: {
      enabled: !!roundId && !!xAppId,
      select: data => ({ claimed: data[0], appId: xAppId }),
    },
  })
}
