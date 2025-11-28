import BigNumber from "bignumber.js"

const SCALING_FACTOR = 1_000_000
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
 * removingExcessDecimals
 * @param amount
 * @param decimals
 * @returns
 */
export const removingExcessDecimals = (amount: string | number | undefined | null, decimals: number | string = 18) => {
  if (!amount || isNaN(Number(amount)) || Number(amount) === 0) return "0"
  return new BigNumber(amount).toFixed(Number(decimals), BigNumber.ROUND_DOWN).toString()
}
