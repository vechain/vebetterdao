import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const address = getConfig().x2EarnAppsContractAddress
const abi = X2EarnApps__factory.abi
const method = "endorsementScoreThreshold" as const

/**
 * Get the query key for endorsement score threshold
 */
export const getEndorsementScoreThreshold = () => {
  getCallClauseQueryKey<typeof abi>({ address, method, args: [] })
}

/**
 *  Hook to get the endorsement score threshold
 * @returns The endorsement score threshold
 */
export const useEndorsementScoreThreshold = () => {
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
