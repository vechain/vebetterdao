import BigNumber from "bignumber.js"

const SCALING_FACTOR = 1_000_000

// Precision factor for percentage calculations (6 decimal places = 1_000_000)
const PERCENTAGE_PRECISION = 1_000_000
const PERCENTAGE_PRECISION_BIGINT = BigInt(PERCENTAGE_PRECISION)
/**
 * scaledDivision
 * @param numerator
 * @param denominator
 * @param scalingFactor (default: 1_000_000)
 * @returns
 */
export const scaledDivision = (numerator: number, denominator: number, scalingFactor = SCALING_FACTOR): number => {
  // if denominator is 0, return 0
  if (denominator === 0) return 0
  const scaledNumerator = numerator * scalingFactor
  return Math.floor(scaledNumerator / denominator) / scalingFactor
}

/**
 * Converts percentage to wei-based voting weight with high precision
 * @param totalVotingPowerWei - Total voting power in wei (bigint)
 * @param percentage - Percentage to convert to voting weight (e.g., 50.5 for 50.5%)
 * @returns Voting weight in wei (bigint)
 *
 * Important: This is a helper function for UI display purposes. It is not intended to be used for contract calls as we might get in-accurate precision.
 */
export const calculateVotingWeightFromPercentage = (totalVotingPowerWei: bigint, percentage: number): bigint => {
  return (totalVotingPowerWei * BigInt(Math.round(percentage * 100))) / 10000n
}

/**
 * Distributes a total percentage equally among a count of items.
 * Uses 6 decimal places of precision to minimize rounding differences.
 *
 * @param totalPercentage - The total percentage to distribute (e.g., 100)
 * @param count - Number of items to distribute among
 * @returns Array of percentages that sum exactly to totalPercentage
 *
 * Example: distributePercentagesEqually(100, 3) => [33.333333, 33.333333, 33.333334]
 */
export const distributePercentagesEqually = (totalPercentage: number, count: number): number[] => {
  if (count <= 0) return []
  if (count === 1) return [totalPercentage]

  // Calculate base percentage with 6 decimal precision using floor
  const basePercentage = Math.floor((totalPercentage / count) * PERCENTAGE_PRECISION) / PERCENTAGE_PRECISION

  // Calculate remainder: total - (base * count)
  const distributed = basePercentage * count
  const remainder = Math.round((totalPercentage - distributed) * PERCENTAGE_PRECISION) / PERCENTAGE_PRECISION

  // Build result array: all get base, last gets base + remainder
  const result: number[] = []
  for (let i = 0; i < count - 1; i++) {
    result.push(basePercentage)
  }
  result.push(Math.round((basePercentage + remainder) * PERCENTAGE_PRECISION) / PERCENTAGE_PRECISION)

  return result
}

/**
 * Distributes total voting power equally among apps using pure BigInt arithmetic.
 * This avoids floating point precision issues entirely.
 *
 * @param totalVotingPowerWei - Total voting power in wei (bigint)
 * @param appCount - Number of apps to distribute to
 * @returns Array of voting weights in wei, one per app
 *
 * Note: The last app receives any remainder to ensure sum equals exactly totalVotingPowerWei
 */
export const distributeVotingPowerEqually = (totalVotingPowerWei: bigint, appCount: number): bigint[] => {
  if (appCount <= 0) return []
  if (appCount === 1) return [totalVotingPowerWei]

  const count = BigInt(appCount)
  const baseAmount = totalVotingPowerWei / count
  const remainder = totalVotingPowerWei % count

  // All apps get base amount, last app gets the remainder added
  const weights: bigint[] = []
  for (let i = 0; i < appCount - 1; i++) {
    weights.push(baseAmount)
  }
  weights.push(baseAmount + remainder)

  return weights
}

/**
 * Converts a percentage allocation to wei amount using BigInt arithmetic.
 * Uses high precision (6 decimal places) to minimize rounding errors.
 *
 * @param totalVotingPowerWei - Total voting power in wei (bigint)
 * @param percentage - Percentage as a number (e.g., 16.666666 for 16.666666%)
 * @returns Voting weight in wei (bigint), always >= 0
 */
export const percentageToWei = (totalVotingPowerWei: bigint, percentage: number): bigint => {
  // Guard against negative percentages
  if (percentage <= 0) return 0n

  // Convert percentage to integer with 6 decimal precision
  // e.g., 16.666666% -> 16666666
  const percentageScaled = BigInt(Math.round(percentage * PERCENTAGE_PRECISION))
  // Calculate: (totalPower * percentageScaled) / (100 * PRECISION)
  return (totalVotingPowerWei * percentageScaled) / (100n * PERCENTAGE_PRECISION_BIGINT)
}

/**
 * Converts multiple percentage allocations to wei amounts, ensuring the sum equals exactly totalVotingPowerWei.
 * This prevents rounding errors from causing the sum to drift from the total.
 *
 * @param totalVotingPowerWei - Total voting power in wei (bigint)
 * @param percentages - Array of percentages (should sum to ~100%)
 * @returns Array of voting weights in wei, guaranteed to sum to totalVotingPowerWei
 */
export const percentagesToWeiWithExactSum = (totalVotingPowerWei: bigint, percentages: number[]): bigint[] => {
  if (percentages.length === 0) return []
  if (percentages.length === 1) return [totalVotingPowerWei]

  // Convert each percentage to wei
  const weights = percentages.map(p => percentageToWei(totalVotingPowerWei, p))

  // Calculate difference between actual sum and expected total
  const actualSum = weights.reduce((sum, w) => sum + w, 0n)
  const difference = totalVotingPowerWei - actualSum

  // Add the difference to the last non-zero weight to ensure exact sum
  // This handles both positive and negative differences from rounding
  if (difference !== 0n) {
    // Find last non-zero weight index (or use last index if all zero)
    let lastNonZeroIndex = weights.length - 1
    for (let i = weights.length - 1; i >= 0; i--) {
      if (weights[i]! > 0n) {
        lastNonZeroIndex = i
        break
      }
    }

    // Only adjust if it won't make the weight negative
    const adjustedWeight = weights[lastNonZeroIndex]! + difference
    if (adjustedWeight >= 0n) {
      weights[lastNonZeroIndex] = adjustedWeight
    }
  }

  return weights
}

/**
 * removingExcessDecimals
 * @param amount
 * @param decimals
 * @returns
 */
export const removingExcessDecimals = (amount: string | number | undefined | null, decimals: number | string = 18) => {
  if (!amount || isNaN(Number(amount)) || Number(amount) === 0) return "0"
  return new BigNumber(amount).toFixed(Number(decimals), BigNumber.ROUND_DOWN).toString()
}
