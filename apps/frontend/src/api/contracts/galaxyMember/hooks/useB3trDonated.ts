import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"
import { ethers } from "ethers"

const contractAddress = getConfig().galaxyMemberContractAddress
const contractInterface = GalaxyMember__factory.createInterface()
const method = "getB3TRdonated"

export const getB3trDonatedQueryKey = (tokenId?: string) => getCallKey({ method, keyArgs: [tokenId] })

/**
 * Custom hook to fetch the amount of B3TR tokens donated for a given token ID.
 *
 * @param {string} [tokenId] - The ID of the token to fetch the donation amount for.
 * @param {boolean} [enabled=true] - Flag to enable or disable the hook.
 * @returns The result of the useCall hook, with the donation amount formatted in Ether.
 */
export const useB3trDonated = (tokenId?: string, enabled = true) => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [tokenId],
    enabled: !!tokenId && enabled,
    mapResponse: res => ethers.formatEther(res.decoded[0]),
  })
}
