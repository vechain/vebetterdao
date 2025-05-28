import { getConfig } from "@repo/config"
import { XAllocationVotingGovernor__factory } from "@repo/contracts"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { formatEther } from "ethers"

const address = getConfig().xAllocationVotingContractAddress
const abi = XAllocationVotingGovernor__factory.abi
const method = "getAppVotesQF" as const

/**
 *  Returns the query key for fetching the number of quadratic funding votes for a given app in a roundId.
 * @param roundId  the roundId the get the votes for
 */
export const getXAppVotesQfQueryKey = (roundId: number | string, appId?: string) =>
  getCallClauseQueryKey<typeof abi>({
    address,
    method,
    args: appId ? [BigInt(roundId), appId as `0x${string}`] : [BigInt(roundId)],
  })

/**
 *  Hook to get the number of quadratic funding votes for a given app in a roundId
 *
 * @param roundId  the roundId the get the votes for
 * @returns  the number of votes for a given roundId
 */
export const useXAppVotesQf = (roundId?: number | string, appId?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [roundId ? BigInt(roundId) : BigInt(0), appId ? (appId as `0x${string}`) : ("" as `0x${string}`)],
    queryOptions: {
      enabled: !!roundId && !!appId,
      select: data => formatEther(data[0]),
    },
  })
}
