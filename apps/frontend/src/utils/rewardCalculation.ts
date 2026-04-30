/**
 * Reward calculation utility matching VoterRewards.sol contract logic
 *
 * Formula from _calculateRawReward:
 * reward = (voterTotal * emissionsAmount) / cycleTotal
 *
 * Fee deduction order (matches _getRewardsAndFees):
 * 1. Navigator fee deducted first from gross reward (basis points / 10000)
 * 2. Relayer fee deducted from remainder (applies to auto-voters AND navigator citizens)
 * 3. Remaining distributed proportionally between reward pools
 */

const SCALING_FACTOR = 1e6
const NAVIGATOR_FEE_BASIS_POINTS = 10000n

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
  /** Max fee in wei (contract default: 100 ether = 100 tokens) */
  feeCap?: bigint
  /** Whether user had auto-voting enabled (determines if fees apply) */
  hadAutoVotingEnabled?: boolean
  /** Whether user is delegated to a navigator */
  isDelegating?: boolean
  /** Navigator fee percentage in basis points (e.g., 2000 = 20%) */
  navigatorFeePercentage?: bigint
}

export interface RewardCalculationResult {
  rawReward: bigint
  rawGmReward: bigint
  totalRawReward: bigint
  fee: bigint
  navigatorFee: bigint
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
 * Calculate relayer fee matching contract's RelayerRewardsPool.calculateRelayerFee:
 * fee = min((totalReward * feePercent) / denominator, feeCap)
 */
function calculateRelayerFee(totalReward: bigint, feePercentage: bigint = 10n, feeCap?: bigint): bigint {
  const fee = (totalReward * feePercentage) / 100n
  if (feeCap !== undefined && fee > feeCap) return feeCap
  return fee
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
  feeCap,
  hadAutoVotingEnabled = false,
  isDelegating = false,
  navigatorFeePercentage = 0n,
}: RewardCalculationInput): RewardCalculationResult {
  const rawReward = calculateRawReward(voterTotal, vote2EarnAmount, cycleTotal)
  const rawGmReward = calculateRawReward(gmWeightTotal, gmEmissionsAmount, cycleGMTotal)

  const totalRawReward = rawReward + rawGmReward

  if (totalRawReward === 0n) {
    return {
      rawReward: 0n,
      rawGmReward: 0n,
      totalRawReward: 0n,
      fee: 0n,
      navigatorFee: 0n,
      netReward: 0n,
      netGmReward: 0n,
      netTotal: 0n,
    }
  }

  // 1. Navigator fee deducted first (basis points / 10000)
  let navigatorFee = 0n
  let afterNavFee = totalRawReward
  if (isDelegating && navigatorFeePercentage > 0n) {
    navigatorFee = (totalRawReward * navigatorFeePercentage) / NAVIGATOR_FEE_BASIS_POINTS
    afterNavFee = totalRawReward - navigatorFee
  }

  // 2. Relayer fee on remainder (applies to auto-voters AND navigator citizens)
  let fee = 0n
  let afterAllFees = afterNavFee
  if (hadAutoVotingEnabled || isDelegating) {
    fee = calculateRelayerFee(afterNavFee, relayerFeePercentage, feeCap)
    afterAllFees = afterNavFee - fee
  }

  // 3. Distribute remaining proportionally between reward pools
  const netReward = totalRawReward > 0n ? (afterAllFees * rawReward) / totalRawReward : 0n
  const netGmReward = afterAllFees - netReward

  return {
    rawReward,
    rawGmReward,
    totalRawReward,
    fee,
    navigatorFee,
    netReward,
    netGmReward,
    netTotal: netReward + netGmReward,
  }
}
