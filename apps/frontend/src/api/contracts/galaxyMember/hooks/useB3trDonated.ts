import { formatEther } from "viem"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { GalaxyMember__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"

const contractAbi = GalaxyMember__factory.abi
const method = "getB3TRdonated"
const contractAddress = getConfig().galaxyMemberContractAddress

export const getB3trDonatedQueryKey = (tokenId: string) => {
  return getCallClauseQueryKey<typeof contractAbi>({
    address: contractAddress,
    method,
    args: [BigInt(tokenId || 0)],
  })
}

/**
 * Custom hook to fetch the amount of B3TR tokens donated for a given token ID.
 *
 * @param {string} [tokenId] - The ID of the token to fetch the donation amount for.
 * @param {boolean} [customEnabled=true] - Flag to enable or disable the hook.
 * @returns The result of the useCall hook, with the donation amount formatted in Ether.
 */
export const useB3trDonated = (tokenId?: string, customEnabled = true) => {
  // Galaxy Member B3TR donated result: [ 10000000000000000000000n ]
  return useCallClause({
    address: contractAddress,
    abi: contractAbi,
    method,
    args: [BigInt(tokenId || 0)],
    queryOptions: {
      enabled: !!tokenId && customEnabled && !!contractAddress,
      select: data => formatEther(data[0]),
    },
  })
}
