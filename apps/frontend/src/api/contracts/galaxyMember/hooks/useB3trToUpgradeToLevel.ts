/**
 * Retrieves the amount of B3TR tokens required to upgrade to a specific level for a given token ID.
 *
 * @param tokenId - The ID of the token.
 * @param enabled - Flag indicating whether the hook is enabled or not. Default is true.
 * @returns The result of the call to the contract method.
 */
import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@repo/contracts"
import { useCall } from "@/hooks"
import { ethers } from "ethers"

const contractAddress = getConfig().galaxyMemberContractAddress
const contractInterface = GalaxyMember__factory.createInterface()
const method = "getB3TRtoUpgradeToLevel"

export const useB3trToUpgradeToLevel = (level: string, enabled = true) => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [level],
    enabled: !!level && enabled,
    mapResponse: res => ethers.formatEther(res.decoded[0]),
  })
}
