import { getConfig } from "@repo/config"
import { VoterRewards__factory } from "@vechain/vebetterdao-contracts/factories/VoterRewards__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const abi = VoterRewards__factory.abi
const address = getConfig().voterRewardsContractAddress
const method = "getFreshnessMultipliers" as const

/**
 * Hook to get the freshness multiplier values from VoterRewards at a given timepoint.
 * Returns the 3 freshness tiers in basis points (10000 = 1x).
 */
export const useFreshnessMultipliers = (timepoint?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(timepoint || 0)],
    queryOptions: {
      enabled: !!timepoint,
    },
  })
}

/**
 * Returns the query key for freshness multipliers
 */
export const getFreshnessMultipliersQueryKey = (timepoint?: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [BigInt(timepoint || 0)],
  })
