import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"

const contractAddress = getConfig().galaxyMemberContractAddress
const contractInterface = GalaxyMember__factory.createInterface()
const method = "levelOf"

export const getLevelOfTokenQueryKey = (tokenId?: string) => getCallKey({ method, keyArgs: [tokenId] })

/**
 * Custom hook that retrieves the level of the specified token.
 *
 * @param tokenId - The token ID to retrieve the level for.
 * @param enabled - Determines whether the hook is enabled or not. Default is true.
 * @returns The level of the specified token.
 */
export const useLevelOfToken = (tokenId?: string, enabled = true) => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [tokenId],
    enabled: !!tokenId && enabled,
  })
}
