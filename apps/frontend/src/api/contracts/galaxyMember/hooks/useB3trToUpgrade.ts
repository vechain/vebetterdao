import { GalaxyMember__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { formatEther } from "viem"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const contractAbi = GalaxyMember__factory.abi
const method = "getB3TRtoUpgrade"
const contractAddress = getConfig().galaxyMemberContractAddress

export const getB3trToUpgradeQueryKey = (tokenId: string) => {
  return getCallClauseQueryKey<typeof contractAbi>({
    address: contractAddress,
    method,
    args: [BigInt(tokenId || 0)],
  })
}

/**
 * Retrieves the amount of B3TR tokens required to upgrade a specific token.
 *
 * @param tokenId - The ID of the token.
 * @param customEnabled - Flag indicating whether the hook is enabled or not. Default is true.
 * @returns The result of the call to the contract method.
 */
export const useB3trToUpgrade = (tokenId?: string, customEnabled = true) => {
  // Galaxy Member B3TR to upgrade result: [ 5000000000000000000000n ]
  return useCallClause({
    address: contractAddress,
    abi: contractAbi,
    method,
    args: [BigInt(tokenId || 0)],
    queryOptions: {
      enabled: !!tokenId && customEnabled && !!contractAddress,
      select: data => Number(formatEther(data[0])),
    },
  })
}
