import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@vechain/vebetterdao-contracts/factories/X2EarnRewardsPool__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const abi = X2EarnRewardsPool__factory.abi
const address = getConfig().x2EarnRewardsPoolContractAddress
const method = "getAllowedImpactKeys" as const

export const getAllowedImpactKeysQueryKey = () => getCallClauseQueryKeyWithArgs({ abi, address, method, args: [] })

/**
 * Hook to get the allowed impact keys from the X2EarnRewardsPool contract
 * @returns Array of allowed impact key strings
 */
export const useAllowedImpactKeys = () => {
  return useCallClause({
    address,
    abi,
    method,
    args: [],
    queryOptions: {
      select: data => data[0] as string[],
      // Cache for a long time since these don't change frequently
      staleTime: 1000 * 60 * 60, // 1 hour
    },
  })
}
