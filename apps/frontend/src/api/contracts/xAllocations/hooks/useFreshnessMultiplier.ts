import { getConfig } from "@repo/config"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

/**
 * Hook to get the freshness multiplier values from VoterRewards at a given timepoint.
 * Returns the 3 freshness tiers in basis points (10000 = 1x).
 */
export const useFreshnessMultipliers = (timepoint?: string) => {
  const voterRewardsAddress = getConfig().voterRewardsContractAddress

  // We need to call VoterRewards directly for this
  // Import the VoterRewards ABI
  return useCallClause({
    abi: [
      {
        inputs: [{ internalType: "uint256", name: "timepoint", type: "uint256" }],
        name: "getFreshnessMultipliers",
        outputs: [
          { internalType: "uint256", name: "tier1", type: "uint256" },
          { internalType: "uint256", name: "tier2", type: "uint256" },
          { internalType: "uint256", name: "tier3", type: "uint256" },
        ],
        stateMutability: "view",
        type: "function",
      },
    ] as const,
    address: voterRewardsAddress,
    method: "getFreshnessMultipliers",
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
    abi: [
      {
        inputs: [{ internalType: "uint256", name: "timepoint", type: "uint256" }],
        name: "getFreshnessMultipliers",
        outputs: [
          { internalType: "uint256", name: "tier1", type: "uint256" },
          { internalType: "uint256", name: "tier2", type: "uint256" },
          { internalType: "uint256", name: "tier3", type: "uint256" },
        ],
        stateMutability: "view",
        type: "function",
      },
    ] as const,
    address: getConfig().voterRewardsContractAddress,
    method: "getFreshnessMultipliers",
    args: [BigInt(timepoint || 0)],
  })
