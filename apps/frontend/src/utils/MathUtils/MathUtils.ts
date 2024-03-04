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
