import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@repo/contracts"
import { useCallClause, getCallClauseQueryKey, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const abi = GalaxyMember__factory.abi
const address = getConfig().galaxyMemberContractAddress
const method = "getB3TRtoUpgrade" as const

export const getB3trToUpgradeQueryKey = (tokenId?: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(tokenId ?? 0)] })

/**
 * Retrieves the amount of B3TR tokens required to upgrade a specific token.
 *
 * @param tokenId - The ID of the token.
 * @param enabled - Flag indicating whether the hook is enabled or not. Default is true.
 * @returns The result of the call to the contract method.
 */
export const useB3trToUpgrade = (tokenId?: string, enabled = true) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(tokenId ?? 0)],
    queryOptions: {
      enabled: !!tokenId && enabled,
      select: data => Number(data[0]),
    },
  })
}
