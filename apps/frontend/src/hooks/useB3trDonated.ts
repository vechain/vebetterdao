import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@vechain/vebetterdao-contracts/factories/GalaxyMember__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { ethers } from "ethers"

const abi = GalaxyMember__factory.abi
const address = getConfig().galaxyMemberContractAddress as `0x${string}`
const method = "getB3TRdonated" as const
export const getB3trDonatedQueryKey = (tokenId?: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(tokenId ?? 0)] })
/**
 * Custom hook to fetch the amount of B3TR tokens donated for a given token ID.
 *
 * @param {string} [tokenId] - The ID of the token to fetch the donation amount for.
 * @param {boolean} [enabled=true] - Flag to enable or disable the hook.
 * @returns The result of the useCall hook, with the donation amount formatted in Ether.
 */
export const useB3trDonated = (tokenId?: string, enabled = true) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(tokenId ?? 0)],
    queryOptions: {
      enabled: !!tokenId && enabled,
      select: data => ethers.formatEther(BigInt(data[0])),
    },
  })
}
