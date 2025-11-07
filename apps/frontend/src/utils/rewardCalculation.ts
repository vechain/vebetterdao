/**
 * Reward calculation utility matching VoterRewards.sol contract logic
 *
 * Formula from _calculateRawReward:
 * reward = (voterTotal * emissionsAmount) / cycleTotal
 *
 * With fees applied:
 * netReward = rawReward - ((fee * rawReward) / totalReward)
 */

const SCALING_FACTOR = 1e6

interface RewardCalculationInput {
  /** User's total weighted votes in cycle */
  voterTotal: bigint
  /** Total weighted votes from all voters in cycle */
  cycleTotal: bigint
  /** Vote2Earn emissions amount for cycle */
  vote2EarnAmount: bigint
  /** GM reward emissions amount for cycle */
  gmEmissionsAmount: bigint
  /** User's total GM weight in cycle */
  gmWeightTotal: bigint
  /** Total GM weight from all voters in cycle */
  cycleGMTotal: bigint
  /** Relayer fee percentage (e.g., 10 = 10% fee) */
  relayerFeePercentage?: number
  /** Whether user had auto-voting enabled (determines if fees apply) */
  hadAutoVotingEnabled?: boolean
}

interface RewardCalculationResult {
  rawReward: bigint
  rawGmReward: bigint
  totalRawReward: bigint
  fee: bigint
  netReward: bigint
  netGmReward: bigint
  netTotal: bigint
}

/**
 * Calculate raw reward using proportional formula
 * Equivalent to contract's _calculateRawReward function
 */
function calculateRawReward(voterTotal: bigint, emissionsAmount: bigint, cycleTotal: bigint): bigint {
  if (voterTotal === 0n || cycleTotal === 0n || emissionsAmount === 0n) {
    return 0n
  }

  // Match contract: (voterTotal * emissionsAmount * SCALING_FACTOR) / cycleTotal / SCALING_FACTOR
  const scaledNumerator = (voterTotal * emissionsAmount * BigInt(SCALING_FACTOR)) / cycleTotal
  return scaledNumerator / BigInt(SCALING_FACTOR)
}

/**
 * Calculate relayer fee based on total reward
 * Simplified: assumes fee calculation similar to contract's relayerRewardsPool.calculateRelayerFee
 */
function calculateRelayerFee(
  totalReward: bigint,
  feePercentage: number = 10, // Default 10%
): bigint {
  return (totalReward * BigInt(feePercentage)) / 100n
}

/**
 * Calculate potential rewards for a user in current cycle
 * Equivalent to contract's _getRewardsAndFees function
 */
export function calculatePotentialRewards({
  voterTotal,
  cycleTotal,
  vote2EarnAmount,
  gmEmissionsAmount,
  gmWeightTotal,
  cycleGMTotal,
  relayerFeePercentage = 10,
  hadAutoVotingEnabled = false,
}: RewardCalculationInput): RewardCalculationResult {
  // Calculate raw rewards
  const rawReward = calculateRawReward(voterTotal, vote2EarnAmount, cycleTotal)
  const rawGmReward = calculateRawReward(gmWeightTotal, gmEmissionsAmount, cycleGMTotal)

  const totalRawReward = rawReward + rawGmReward

  // If no rewards, return zeros
  if (totalRawReward === 0n) {
    return {
      rawReward: 0n,
      rawGmReward: 0n,
      totalRawReward: 0n,
      fee: 0n,
      netReward: 0n,
      netGmReward: 0n,
      netTotal: 0n,
    }
  }

  // Calculate fees if auto-voting was enabled
  let fee = 0n
  let netReward = rawReward
  let netGmReward = rawGmReward

  if (hadAutoVotingEnabled) {
    fee = calculateRelayerFee(totalRawReward, relayerFeePercentage)

    // Apply proportional fee distribution
    netReward = rawReward - (fee * rawReward) / totalRawReward
    netGmReward = rawGmReward - (fee * rawGmReward) / totalRawReward
  }

  return {
    rawReward,
    rawGmReward,
    totalRawReward,
    fee,
    netReward,
    netGmReward,
    netTotal: netReward + netGmReward,
  }
}

/**
 * Format reward to human-readable string with K/M/B notation
 */
export function formatReward(amount: bigint | number): string {
  const num = typeof amount === "bigint" ? Number(amount) : amount

  // Assuming B3TR has 18 decimals
  const decimals = 18
  const divisor = Math.pow(10, decimals)
  const value = num / divisor

  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`
  }
  return value.toFixed(2)
}

/**
 * Convert formatted reward back to bigint (assuming 18 decimals)
 */
export function parseReward(formatted: string): bigint {
  const decimals = 18
  const multiplier = Math.pow(10, decimals)

  let numValue = 0
  if (formatted.includes("B")) {
    numValue = parseFloat(formatted) * 1e9
  } else if (formatted.includes("M")) {
    numValue = parseFloat(formatted) * 1e6
  } else if (formatted.includes("K")) {
    numValue = parseFloat(formatted) * 1e3
  } else {
    numValue = parseFloat(formatted)
  }

  return BigInt(Math.floor(numValue * multiplier))
}
