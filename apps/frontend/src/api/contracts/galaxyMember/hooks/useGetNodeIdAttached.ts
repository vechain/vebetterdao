import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@vechain/vebetterdao-contracts/factories/GalaxyMember__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().galaxyMemberContractAddress
const abi = GalaxyMember__factory.abi
const method = "getNodeIdAttached" as const
export const getNodeIdAttachedQueryKey = (tokenId?: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(tokenId || "0")] })
/**
 * Custom hook that retrieves the Vechain Node Token ID attached to the given GM Token ID.
 *
 * @param tokenId - The GM Token ID to check for attached node.
 * @returns The Vechain Node Token ID attached to the given GM Token ID.
 */
export const useGetNodeIdAttached = (tokenId?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(tokenId || "0")],
    queryOptions: {
      select: data => data[0].toString(),
      enabled: !!tokenId,
    },
  })
}
