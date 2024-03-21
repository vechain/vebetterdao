import { removingExcessDecimals, scaledDivision } from "./MathUtils"

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
