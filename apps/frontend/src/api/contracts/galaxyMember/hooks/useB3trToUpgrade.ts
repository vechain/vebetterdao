/**
 * Retrieves the amount of B3TR tokens required to upgrade a specific token.
 *
 * @param tokenId - The ID of the token.
 * @param enabled - Flag indicating whether the hook is enabled or not. Default is true.
 * @returns The result of the call to the contract method.
 */
import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"
import { ethers } from "ethers"

const contractAddress = getConfig().galaxyMemberContractAddress
const contractInterface = GalaxyMember__factory.createInterface()
const method = "getB3TRtoUpgrade"

export const getB3trToUpgradeQueryKey = (tokenId?: string) => getCallKey({ method, keyArgs: [tokenId] })

export const useB3trToUpgrade = (tokenId?: string, enabled = true) => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [tokenId],
    enabled: !!tokenId && enabled,
    mapResponse: res => ethers.formatEther(res.decoded[0]),
  })
}
