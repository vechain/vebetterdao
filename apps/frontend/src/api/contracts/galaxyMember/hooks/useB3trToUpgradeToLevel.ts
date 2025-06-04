import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@repo/contracts"
import { formatEther } from "viem"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const contractAbi = GalaxyMember__factory.abi
const method = "getB3TRtoUpgradeToLevel"
const contractAddress = getConfig().galaxyMemberContractAddress

export const getB3trToUpgradeToLevelQueryKey = (level: string) => {
  return getCallClauseQueryKey<typeof contractAbi>({
    address: contractAddress,
    method,
    args: [BigInt(level || 0)],
  })
}

/**
 * Retrieves the amount of B3TR tokens required to upgrade to a specific level for a given token ID.
 *
 * @param level - The level to upgrade to.
 * @param customEnabled - Flag indicating whether the hook is enabled or not. Default is true.
 * @returns The result of the call to the contract method.
 */
export const useB3trToUpgradeToLevel = (level?: string, customEnabled = true) => {
  // Galaxy Member B3TR to upgrade to level result: [ 5000000000000000000000n ]
  return useCallClause({
    address: contractAddress,
    abi: contractAbi,
    method,
    args: [BigInt(level || 0)],
    queryOptions: {
      enabled: !!level && customEnabled && !!contractAddress,
      select: data => formatEther(data[0]),
    },
  })
}
