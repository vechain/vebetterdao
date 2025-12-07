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
  relayerFeePercentage?: bigint
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
  feePercentage: bigint = 10n, // Default 10%
): bigint {
  return (totalReward * feePercentage) / 100n
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
  relayerFeePercentage = 10n,
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

    // Apply proportional fee distribution with underflow protection
    const feePortionForReward = (fee * rawReward) / totalRawReward
    const feePortionForGmReward = (fee * rawGmReward) / totalRawReward

    // Ensure we don't underflow (fee portions should never exceed raw rewards)
    netReward = rawReward >= feePortionForReward ? rawReward - feePortionForReward : 0n
    netGmReward = rawGmReward >= feePortionForGmReward ? rawGmReward - feePortionForGmReward : 0n
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
