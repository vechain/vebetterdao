import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@repo/contracts"

const abi = XAllocationPool__factory.abi
const address = getConfig().xAllocationPoolContractAddress
const method = "isQuadraticFundingDisabledForCurrentRound" as const

/**
 *  Generates a query key for checking if quadratic funding is disabled
 *
 * @returns An array representing the query key
 */
export const getIsQuadraticFundingDisabledQueryKey = () => getCallClauseQueryKey({ abi, address, method })

export const useIsQuadraticFundingDisabled = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data => data[0],
    },
  })
}
