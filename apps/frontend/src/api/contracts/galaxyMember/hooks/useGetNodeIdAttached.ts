import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"

const contractAddress = getConfig().galaxyMemberContractAddress
const contractInterface = GalaxyMember__factory.createInterface()
const method = "getNodeIdAttached"

export const getNodeIdAttachedQueryKey = (tokenId?: string) => getCallKey({ method, keyArgs: [tokenId] })

/**
 * Custom hook that retrieves the Vechain Node Token ID attached to the given GM Token ID.
 *
 * @param tokenId - The GM Token ID to check for attached node.
 * @returns The Vechain Node Token ID attached to the given GM Token ID.
 */
export const useGetNodeIdAttached = (tokenId: string | null) => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [tokenId],
    enabled: !!tokenId,
  })
}
