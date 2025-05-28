import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@repo/contracts"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const address = getConfig().galaxyMemberContractAddress
const abi = GalaxyMember__factory.abi
const method = "levelOf" as const

export const getLevelOfTokenQueryKey = (tokenId?: string) =>
  getCallClauseQueryKey<typeof abi>({ address, method, args: [BigInt(tokenId || "0")] })

/**
 * Custom hook that retrieves the level of the specified token.
 *
 * @param tokenId - The token ID to retrieve the level for.
 * @param enabled - Determines whether the hook is enabled or not. Default is true.
 * @returns The level of the specified token.
 */
export const useLevelOfToken = (tokenId?: string, enabled = true) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(tokenId || "0")],
    queryOptions: {
      enabled: !!tokenId && enabled,
      select: data => data[0].toString(),
    },
  })
}
