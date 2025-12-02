/**
 * To run tests
 * npx vitest run src/utils/MathUtils/MathUtils.test.ts --globals
 */

import {
  removingExcessDecimals,
  scaledDivision,
  distributeVotingPowerEqually,
  distributePercentagesEqually,
  percentageToWei,
  percentagesToWeiWithExactSum,
} from "./MathUtils"

describe("scaledDivision function", () => {
  // Test case: Normal division
  test("should return correct result for normal division", () => {
    expect(scaledDivision(10, 2)).toEqual(5)
  })
  // Test case: Division with scaling factor
  test("should return correct result for division with scaling factor", () => {
    expect(scaledDivision(10, 3, 1000)).toEqual(3.333)
  })
  // Test case: Division by zero
  test("should return 0 when dividing by zero", () => {
    expect(scaledDivision(10, 0)).toEqual(0)
  })
  // Test case: Large numbers
  test("should return correct result for large numbers", () => {
    expect(scaledDivision(999999999, 111111111)).toEqual(9)
  })
  // Test case: Negative numbers
  test("should return correct result for negative numbers", () => {
    expect(scaledDivision(-10, 2)).toEqual(-5)
  })
})
describe("removingExcessDecimals function", () => {
  test('should return "0" when amount is null', () => {
    expect(removingExcessDecimals(null, 2)).toBe("0")
  })
  test('should return "0" when amount is undefined', () => {
    expect(removingExcessDecimals(undefined, 2)).toBe("0")
  })
  test('should return "0" when amount is 0', () => {
    expect(removingExcessDecimals(0, 2)).toBe("0")
  })
  test('should return "0" when amount is "0"', () => {
    expect(removingExcessDecimals("0", 2)).toBe("0")
  })
  test('should return "0" when amount is not a number', () => {
    expect(removingExcessDecimals("not a number", 2)).toBe("0")
  })
  test('should return "0" when amount is "."', () => {
    expect(removingExcessDecimals(".", 2)).toBe("0")
  })

  test("should return the number with specified decimals when valid amount and decimals are provided", () => {
    expect(removingExcessDecimals(123.456, 2)).toBe("123.45")
  })

  test("should return the number with specified decimals when valid amount and decimals are provided", () => {
    expect(removingExcessDecimals("133333.666666666666666666666666", 4)).toBe("133333.6666")
  })
})

describe("distributePercentagesEqually function", () => {
  test("should return empty array for 0 count", () => {
    expect(distributePercentagesEqually(100, 0)).toEqual([])
  })

  test("should return full amount for 1 count", () => {
    expect(distributePercentagesEqually(100, 1)).toEqual([100])
  })

  test("should distribute 100% evenly for 2 items", () => {
    const result = distributePercentagesEqually(100, 2)
    expect(result).toEqual([50, 50])
    expect(result.reduce((a, b) => a + b, 0)).toBe(100)
  })

  test("should handle 3 items with remainder", () => {
    const result = distributePercentagesEqually(100, 3)
    // 100/3 = 33.333333... last gets remainder
    expect(result[0]).toBe(33.333333)
    expect(result[1]).toBe(33.333333)
    expect(result[2]).toBeCloseTo(33.333334, 5)
    expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 5)
  })

  test("should handle 6 items (common use case)", () => {
    const result = distributePercentagesEqually(100, 6)
    // 100/6 = 16.666666...
    expect(result.length).toBe(6)
    expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 5)
  })

  test("should handle partial total percentage", () => {
    // When distributing remaining % among unlocked apps
    const result = distributePercentagesEqually(60, 3)
    expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(60, 5)
  })
})

describe("distributeVotingPowerEqually function", () => {
  test("should return empty array for 0 apps", () => {
    expect(distributeVotingPowerEqually(1000000000000000000n, 0)).toEqual([])
  })

  test("should return full amount for 1 app", () => {
    const total = 1000000000000000000n // 1 token in wei
    expect(distributeVotingPowerEqually(total, 1)).toEqual([total])
  })

  test("should distribute evenly for 2 apps with even total", () => {
    const total = 1000000000000000000n // 1 token in wei
    const result = distributeVotingPowerEqually(total, 2)
    expect(result).toEqual([500000000000000000n, 500000000000000000n])
    expect(result.reduce((a, b) => a + b, 0n)).toBe(total)
  })

  test("should handle remainder correctly for 3 apps", () => {
    const total = 1000000000000000000n // 1 token in wei (not divisible by 3)
    const result = distributeVotingPowerEqually(total, 3)
    // 1e18 / 3 = 333333333333333333 with remainder 1
    expect(result[0]).toBe(333333333333333333n)
    expect(result[1]).toBe(333333333333333333n)
    expect(result[2]).toBe(333333333333333334n) // gets the remainder
    expect(result.reduce((a, b) => a + b, 0n)).toBe(total)
  })

  test("should handle 6 apps (the user's case)", () => {
    // Simulate ~3593 tokens in wei
    const total = 3593000000000000000000n
    const result = distributeVotingPowerEqually(total, 6)
    // All amounts should be very close
    const base = total / 6n
    expect(result[0]).toBe(base)
    expect(result[5]).toBe(base + (total % 6n)) // last gets remainder
    expect(result.reduce((a, b) => a + b, 0n)).toBe(total)
  })

  /**
   * BUG REPRODUCTION TEST
   *
   * The user reported these values when selecting "Equal votes" for 6 apps:
   * [ "598570844000000000000", "598570844000000000000", "598570844000000000000",
   *   "598570844000000000000", "598570844000000000000", "600007989000000000000" ]
   *
   * The last value is ~1.44 tokens higher than the others!
   * Total = 5 * 598570844 + 600007989 = 3592862209 tokens (in wei units without decimals)
   */
  test("BUG FIX: should NOT produce the 1.44 token difference reported by user", () => {
    // Exact total from user's reported values
    const reportedValues = [
      598570844000000000000n,
      598570844000000000000n,
      598570844000000000000n,
      598570844000000000000n,
      598570844000000000000n,
      600007989000000000000n, // This was the buggy value - ~1.44 tokens higher!
    ]
    const totalFromBug = reportedValues.reduce((a, b) => a + b, 0n)
    // totalFromBug = 3592862209000000000000n

    // Now test our fix with the same total
    const result = distributeVotingPowerEqually(totalFromBug, 6)

    // The difference between max and min should be tiny (just remainder wei, not 1+ token)
    const maxValue = result.reduce((max, v) => (v > max ? v : max), 0n)
    const minValue = result.reduce((min, v) => (v < min ? v : min), result[0]!)

    const differenceWei = maxValue - minValue
    const differenceTokens = Number(differenceWei) / 1e18

    // OLD BUG: difference was ~1.44 tokens (1437145000000000000 wei)
    // NEW FIX: difference should be < 6 wei (just the remainder)
    expect(differenceWei).toBeLessThan(6n) // Max remainder for 6 apps
    expect(differenceTokens).toBeLessThan(0.000001) // Essentially zero in token terms

    // Verify sum is exact
    expect(result.reduce((a, b) => a + b, 0n)).toBe(totalFromBug)
  })
})

describe("percentageToWei function", () => {
  test("should convert 100% to full amount", () => {
    const total = 1000000000000000000n // 1 token in wei
    expect(percentageToWei(total, 100)).toBe(total)
  })

  test("should convert 50% to half", () => {
    const total = 1000000000000000000n
    expect(percentageToWei(total, 50)).toBe(500000000000000000n)
  })

  test("should handle decimal percentages", () => {
    const total = 1000000000000000000n
    // 16.666666% of 1 token
    const result = percentageToWei(total, 16.666666)
    expect(result).toBe(166666660000000000n)
  })

  test("should handle small percentages", () => {
    const total = 1000000000000000000000n // 1000 tokens
    // 0.01% = 0.1 tokens = 100000000000000000 wei
    const result = percentageToWei(total, 0.01)
    expect(result).toBe(100000000000000000n)
  })

  // Edge case tests for bug-proofing
  test("should return 0 for negative percentage", () => {
    const total = 1000000000000000000n
    expect(percentageToWei(total, -10)).toBe(0n)
  })

  test("should return 0 for zero percentage", () => {
    const total = 1000000000000000000n
    expect(percentageToWei(total, 0)).toBe(0n)
  })

  test("should handle percentage over 100%", () => {
    const total = 1000000000000000000n
    // 150% should return 1.5x the total
    expect(percentageToWei(total, 150)).toBe(1500000000000000000n)
  })
})

describe("percentagesToWeiWithExactSum function", () => {
  test("should return empty array for empty percentages", () => {
    const total = 1000000000000000000n
    expect(percentagesToWeiWithExactSum(total, [])).toEqual([])
  })

  test("should return full amount for single percentage", () => {
    const total = 1000000000000000000n
    expect(percentagesToWeiWithExactSum(total, [100])).toEqual([total])
  })

  test("should sum exactly to total for equal percentages", () => {
    const total = 1000000000000000000n
    const result = percentagesToWeiWithExactSum(total, [50, 50])
    expect(result.reduce((a, b) => a + b, 0n)).toBe(total)
  })

  test("should sum exactly to total for uneven percentages", () => {
    const total = 1000000000000000000n
    // 33.333333% + 33.333333% + 33.333334% = 100%
    const result = percentagesToWeiWithExactSum(total, [33.333333, 33.333333, 33.333334])
    expect(result.reduce((a, b) => a + b, 0n)).toBe(total)
  })

  test("should handle real-world case with 6 apps and odd percentages", () => {
    // ~3593 tokens, custom percentages that don't divide evenly
    const total = 3592862209000000000000n
    const percentages = [20, 15, 25, 10, 18, 12] // sums to 100
    const result = percentagesToWeiWithExactSum(total, percentages)

    // Sum must be exact
    expect(result.reduce((a, b) => a + b, 0n)).toBe(total)

    // Each should be approximately the right proportion
    expect(result[0]).toBeGreaterThan(0n)
    expect(result[1]).toBeGreaterThan(0n)
  })

  test("should correct rounding errors that cause sum > total", () => {
    // Create a scenario where individual percentages round UP
    const total = 100000000000000000n // 0.1 token
    // Percentages that might cause cumulative rounding issues
    const percentages = [14.285714, 14.285714, 14.285714, 14.285714, 14.285714, 14.285714, 14.285716]
    const result = percentagesToWeiWithExactSum(total, percentages)

    expect(result.reduce((a, b) => a + b, 0n)).toBe(total)
  })

  test("should handle zero percentages in the array", () => {
    const total = 1000000000000000000n
    const percentages = [50, 0, 50]
    const result = percentagesToWeiWithExactSum(total, percentages)

    expect(result[1]).toBe(0n) // middle should be 0
    expect(result.reduce((a, b) => a + b, 0n)).toBe(total)
  })

  /**
   * CRITICAL TEST: Ensures the new function guarantees exact sum
   * even when percentages have floating point precision issues.
   *
   * Note: Individual values may vary slightly due to rounding, but
   * the SUM is guaranteed to be exact. For truly equal distribution,
   * use distributeVotingPowerEqually instead.
   */
  test("REGRESSION: should guarantee exact sum even with float percentage precision issues", () => {
    const total = 3592862209000000000000n
    // Simulate 6 apps with "equal" percentages as floats
    const equalPercent = 100 / 6 // 16.666666666666668
    const percentages = Array(6).fill(equalPercent) as number[]

    const result = percentagesToWeiWithExactSum(total, percentages)

    // The CRITICAL guarantee: sum must be exact
    expect(result.reduce((a, b) => a + b, 0n)).toBe(total)

    // All values should be positive
    result.forEach(v => expect(v).toBeGreaterThan(0n))

    // The adjustment should be on the last element only
    // First 5 values should be identical (same percentage input)
    const firstFiveAllSame = result.slice(0, 5).every(v => v === result[0])
    expect(firstFiveAllSame).toBe(true)
  })
})
