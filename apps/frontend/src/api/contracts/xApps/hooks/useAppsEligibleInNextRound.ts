import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts"

const address = getConfig().x2EarnAppsContractAddress
const abi = X2EarnApps__factory.abi
const method = "allEligibleApps" as const

/**
 * Returns the query key for fetching apps eligible in next round.
 * @returns The query key for fetching apps eligible in next round.
 */
export const getAppsEligibleInNextRoundQueryKey = () => getCallClauseQueryKey({ abi, address, method })

/**
 * Hook to get all apps that will be eligible in the next allocation round
 * @returns the ids of eligible apps
 */
export const useAppsEligibleInNextRound = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data => data[0] as string[],
    },
  })
}
