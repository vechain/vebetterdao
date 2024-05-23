import { filterAmountInput } from "./filterAmountInput"

describe("filterAmountInput function", () => {
  it("should correctly filter amount input", () => {
    expect(filterAmountInput("1,000.50")).toBe("1000.50")
    expect(filterAmountInput("1.234567890123456789012345")).toBe("1.234567890123456789")
    expect(filterAmountInput("1,000.50", { maxBalance: "500" })).toBe("500") // maxBalance is smaller than filtered amount
    expect(filterAmountInput("1000.50", { maxBalance: "1500" })).toBe("1000.50") // maxBalance is greater than filtered amount
  })

  it("should handle empty amount input", () => {
    expect(filterAmountInput("")).toBe("")
  })

  it("should handle non-numeric input", () => {
    expect(filterAmountInput("abc")).toBe("")
  })

  it("should handle invalid decimal separators", () => {
    expect(filterAmountInput("1.23.45")).toBe("123.45")
  })

  it("should handle excessive decimal digits", () => {
    expect(filterAmountInput("1.234567890123456789012345")).toBe("1.234567890123456789")
  })

  it("should handle undefined maxBalance", () => {
    expect(filterAmountInput("1000.50")).toBe("1000.50")
  })

  it("should handle maxBalance correctly", () => {
    expect(filterAmountInput("1000.50", { maxBalance: "500" })).toBe("500") // maxBalance is smaller than filtered amount
    expect(filterAmountInput("1000.50", { maxBalance: "1500" })).toBe("1000.50") // maxBalance is greater than filtered amount
  })
})
