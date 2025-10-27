import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@vechain/vebetterdao-contracts/factories/GalaxyMember__factory"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const address = getConfig().galaxyMemberContractAddress
const abi = GalaxyMember__factory.abi
const method = "paused" as const
/**
 * Returns the query key for fetching the Galaxy Member paused status.
 * @returns The query key for fetching the Galaxy Member paused status.
 */
export const getIsGMPausedQueryKey = () => getCallClauseQueryKey({ abi, address, method })
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
      select: data => data[0],
    },
  })
}
