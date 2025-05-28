import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@repo/contracts"

const address = getConfig().galaxyMemberContractAddress
const abi = GalaxyMember__factory.abi
const method = "paused" as const

/**
 * Returns the query key for fetching the Galaxy Member paused status.
 * @returns The query key for fetching the Galaxy Member paused status.
 */
export const getIsGMPausedQueryKey = () => getCallClauseQueryKey<typeof abi>({ address, method, args: [] })

/**
 * Hook to check if the GalaxyMember contract is paused
 * @returns boolean indicating if the GalaxyMember contract is paused
 */
export const useIsGMpaused = () => {
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
