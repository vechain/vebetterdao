import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain-kit/vebetterdao-contracts"

const address = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi
const method = "paused" as const

/**
 * Returns the query key for fetching the B3TR Governor paused status.
 * @returns The query key for fetching the B3TR Governor paused status.
 */
export const getIsB3TRGovernorPausedQueryKey = () => getCallClauseQueryKey({ abi, address, method })

/**
 * Hook to check if the B3TRGovernor contract is paused
 * @returns boolean indicating if the B3TRGovernor contract is paused
 */
export const useB3TRGovernorPaused = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data => Boolean(data[0]),
    },
  })
}
