import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().galaxyMemberContractAddress
const abi = GalaxyMember__factory.abi
const method = "getIdAttachedToNode" as const

export const getGetTokenIdAttachedToNodeQueryKey = (nodeId?: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(nodeId || "0")] })

/**
 * Custom hook that retrieves the GM Token ID attached to the given Vechain Node ID.
 *
 * @param nodeId - The Vechain Node ID to check for attached GM Token.
 * @param enabled - Determines whether the hook is enabled or not. Default is true.
 * @returns The GM Token ID attached to the given Vechain Node ID.
 */
export const useGetTokenIdAttachedToNode = (nodeId?: string, enabled = true) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(nodeId || "0")],
    queryOptions: {
      select: data => data[0].toString(),
      enabled: !!nodeId && enabled,
    },
  })
}
