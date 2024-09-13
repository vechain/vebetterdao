import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@repo/contracts"
import { useCall } from "@/hooks"

const contractAddress = getConfig().galaxyMemberContractAddress
const contractInterface = GalaxyMember__factory.createInterface()
const method = "getNodeIdAttached"

/**
 * Custom hook that retrieves the Vechain Node Token ID attached to the given GM Token ID.
 *
 * @param tokenId - The GM Token ID to check for attached node.
 * @param enabled - Determines whether the hook is enabled or not. Default is true.
 * @returns The Vechain Node Token ID attached to the given GM Token ID.
 */
export const useGetNodeIdAttached = (tokenId: string | null, enabled = true) => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [tokenId],
    enabled: !!tokenId && enabled,
  })
}
