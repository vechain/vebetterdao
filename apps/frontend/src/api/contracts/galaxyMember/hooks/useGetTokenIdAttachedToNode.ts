import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@repo/contracts"
import { useCall } from "@/hooks"

const contractAddress = getConfig().galaxyMemberContractAddress
const contractInterface = GalaxyMember__factory.createInterface()
const method = "getIdAttachedToNode"

/**
 * Custom hook that retrieves the GM Token ID attached to the given Vechain Node ID.
 *
 * @param nodeId - The Vechain Node ID to check for attached GM Token.
 * @param enabled - Determines whether the hook is enabled or not. Default is true.
 * @returns The GM Token ID attached to the given Vechain Node ID.
 */
export const useGetTokenIdAttachedToNode = (nodeId?: string, enabled = true) => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [nodeId],
    enabled: !!nodeId && enabled,
  })
}
