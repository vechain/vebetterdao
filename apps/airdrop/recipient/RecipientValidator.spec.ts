import { containsDuplicates, verifyAmount, validateRecipients } from "./RecipientValidator"

describe("containsDuplicates", () => {
  it("should return true if there are duplicates", () => {
    const containers = [
      { address: "0x1", amount: "1" },
      { address: "0x2", amount: "2" },
      { address: "0x3", amount: "3" },
      { address: "0x1", amount: "4" },
    ]

    expect(containsDuplicates(containers)).toBe(true)
  })

  it("should return false if there are no duplicates", () => {
    const containers = [
      { address: "0x1", amount: "1" },
      { address: "0x2", amount: "2" },
      { address: "0x3", amount: "3" },
    ]

    expect(containsDuplicates(containers)).toBe(false)
  })

  it("case insensitive", () => {
    const containers = [
      { address: "0x1A", amount: "1" },
      { address: "0x2", amount: "2" },
      { address: "0x3", amount: "3" },
      { address: "0x1a", amount: "4" },
      { address: "0x1", amount: "5" },
    ]

    expect(containsDuplicates(containers)).toBe(true)
  })

  it("insensitive to whitespace", () => {
    const containers = [
      { address: "0x1", amount: "1" },
      { address: "0x2", amount: "2" },
      { address: "0x3", amount: "3" },
      { address: "0x1 ", amount: "4" },
    ]

    expect(containsDuplicates(containers)).toBe(true)
  })

  it("insensitive to hex prefix", () => {
    const containers = [
      { address: "0x1", amount: "1" },
      { address: "0x2", amount: "2" },
      { address: "0x3", amount: "3" },
      { address: "1", amount: "4" },
    ]

    expect(containsDuplicates(containers)).toBe(true)
  })

  it("insensitive to hex prefix and whitespace and case", () => {
    const containers = [
      { address: "0x1A", amount: "1" },
      { address: "0x2", amount: "2" },
      { address: "0x3", amount: "3" },
      { address: "1a ", amount: "4" },
    ]

    expect(containsDuplicates(containers)).toBe(true)
  })
})

describe("verifyAmount", () => {
  it("should return true if the amount is a valid integer n (0 > n > 10^9)", () => {
    expect(verifyAmount("1")).toBe(true)
    expect(verifyAmount("300000")).toBe(true)
    expect(verifyAmount("50001")).toBe(true)
    expect(verifyAmount("20")).toBe(true)
    expect(verifyAmount("999999999")).toBe(true)
  })

  it("should return false if the amount is not a valid integer n (0 > n > 10^9)", () => {
    expect(verifyAmount("0")).toBe(false)
    expect(verifyAmount("1000000000")).toBe(false)
    expect(verifyAmount("1.0")).toBe(false)
    expect(verifyAmount("1.1")).toBe(false)
    expect(verifyAmount("not an integer")).toBe(false)
    expect(verifyAmount("")).toBe(false)
    expect(verifyAmount(" ")).toBe(false)
    expect(verifyAmount(" 1")).toBe(false)
    expect(verifyAmount("1 ")).toBe(false)
    expect(verifyAmount("1000000000000000")).toBe(false)
    expect(verifyAmount("-1")).toBe(false)
  })
})

describe("validateRecipients", () => {
  it("should return an empty array if all recipients are valid", () => {
    const recipients = [
      { address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", amount: "1" },
      { address: "0xF370940aBDBd2583bC80bfc19d19bc216C88Ccf0", amount: "2" },
      { address: "0x99602e4Bbc0503b8ff4432bB1857F916c3653B85", amount: "3" },
    ]

    expect(validateRecipients(recipients)).toEqual([])
  })

  it("should return an array of problems if any recipients are invalid", () => {
    const recipients = [
      { address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", amount: "1" },
      { address: "0xF370940aBDBd2583bC80bfc19d19bc216C88Ccf0", amount: "2" },
      { address: "invalid", amount: "3" },
    ]

    expect(validateRecipients(recipients)).toEqual(["Invalid address: invalid"])
  })

  it("should return an array of problems if any amounts are invalid", () => {
    const recipients = [
      { address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", amount: "1" },
      { address: "0xF370940aBDBd2583bC80bfc19d19bc216C88Ccf0", amount: "2" },
      { address: "0x99602e4Bbc0503b8ff4432bB1857F916c3653B85", amount: "-1" },
    ]

    expect(validateRecipients(recipients)).toEqual(["Invalid amount: -1"])
  })

  it("should return an array of problems if any recipients are invalid and amounts are invalid", () => {
    const recipients = [
      { address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", amount: "1" },
      { address: "invalid", amount: "2" },
      { address: "0x99602e4Bbc0503b8ff4432bB1857F916c3653B85", amount: "-1" },
    ]

    expect(validateRecipients(recipients)).toEqual(["Invalid address: invalid", "Invalid amount: -1"])
  })

  it("should return an array of problems if any recipients are invalid and amounts are invalid", () => {
    const recipients = [
      { address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", amount: "1" },
      { address: "invalid", amount: "2" },
      { address: "0x99602e4Bbc0503b8ff4432bB1857F916c3653B85", amount: "-1" },
    ]

    expect(validateRecipients(recipients)).toEqual(["Invalid address: invalid", "Invalid amount: -1"])
  })

  it("should return an array of problems if there are duplicate addresses", () => {
    const recipients = [
      { address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", amount: "1" },
      { address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", amount: "2" },
      { address: "0x99602e4Bbc0503b8ff4432bB1857F916c3653B85", amount: "3" },
    ]

    expect(validateRecipients(recipients)).toEqual([
      "Duplicate addresses found. Please ensure all addresses are unique.",
    ])
  })

  it("should not run duplicate check if there are other problems", () => {
    const recipients = [
      { address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", amount: "1" },
      { address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", amount: "2" },
      { address: "invalid", amount: "3" },
    ]

    expect(validateRecipients(recipients)).toEqual(["Invalid address: invalid"])
  })
})
