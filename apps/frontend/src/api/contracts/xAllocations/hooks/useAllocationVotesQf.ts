import { getConfig } from "@repo/config"
import { XAllocationVotingGovernor__factory } from "@repo/contracts"
import { useCallClause, getCallClauseQueryKey, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().xAllocationVotingContractAddress
const abi = XAllocationVotingGovernor__factory.abi
const method = "totalVotesQF" as const

/**
 *  Returns the query key for fetching the number of quadratic funding votes for a given roundId.
 * @param roundId  the roundId the get the votes for
 */
export const getAllocationVotesQfQueryKey = (roundId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(roundId)] })

/**
 *  Hook to get the number of quadratic funding votes for a given roundId
 * @param roundId  the roundId the get the votes for
 * @returns  the number of votes for a given roundId
 */
export const useAllocationVotesQf = (roundId?: number | string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(roundId ?? 0)],
    queryOptions: {
      enabled: !!roundId,
      select: data => Number(data[0]),
    },
  })
}
