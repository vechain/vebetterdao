import { getTestKey } from "../../test/utils/pks"
import {
  validateBatchSize,
  validateGasPriceCoef,
  validateInputFilePath,
  validateKeystore,
  validatePrivateKey,
} from "./InputValidation"

describe("validateInputFilePath", () => {
  it("should return if the input file path is valid", async () => {
    const res = await validateInputFilePath("input-fund-pool.json")

    expect(res).toBe(true)
  })
  it("should return a string if the input file path is invalid", async () => {
    const res = await validateInputFilePath("invalid-input-fund-pool.json")

    expect(res).toBe("Failed to load input file. Please try again")
  })
  it("should return a string if the input file path is invalid", async () => {
    const res = await validateInputFilePath("invalid-input-fund-pool.json")

    expect(res).toBe("Failed to load input file. Please try again")
  })
  it("should return a string if no recipients are found in the input file", async () => {
    const res = await validateInputFilePath("valid-json-no-recipients.json")

    expect(res).toBe("Failed to load input file. Please try again")
  })
  it("should return a string if the input file contains invalid JSON", async () => {
    const res = await validateInputFilePath("invalid-json.json")

    expect(res).toBe("Failed to load input file. Please try again")
  })
  it("should return details of the validation errors if the input file fails validation", async () => {
    const res = await validateInputFilePath("input-invalid-address.json")

    expect(res).toBe(
      "The input file failed to pass validation:\n - Invalid address: not an address\n - Invalid amount: -1",
    )
  })
})

describe("validateGasPriceCoef", () => {
  it("should return true if the gas price coefficient is valid", async () => {
    const res = validateGasPriceCoef("128")

    expect(res).toBe(true)
  })

  it("should return a string if the gas price coefficient is invalid", async () => {
    const res = validateGasPriceCoef("invalid")

    expect(res).toBe("Invalid coefficient. Must be an integer in the range 0-255")
  })

  it("should return a string if the gas price coefficient is out of range", async () => {
    const res = validateGasPriceCoef("256")

    expect(res).toBe("Invalid coefficient. Must be an integer in the range 0-255")
  })

  it("should return a string if the gas price coefficient is negative", async () => {
    const res = validateGasPriceCoef("-1")

    expect(res).toBe("Invalid coefficient. Must be an integer in the range 0-255")
  })
})

describe("validateBatchSize", () => {
  it("should return true if the batch size is valid", async () => {
    const res = validateBatchSize("100")

    expect(res).toBe(true)
  })

  it("batch size must be at least 1", async () => {
    const res = validateBatchSize("0")

    expect(res).toBe("Invalid batch size. Must be a positive integer larger than 0")
  })

  it("should return a string if the batch size is invalid", async () => {
    const res = validateBatchSize("invalid")

    expect(res).toBe("Invalid batch size. Must be a positive integer larger than 0")
  })

  it("should return a string if the batch size is negative", async () => {
    const res = validateBatchSize("-1")

    expect(res).toBe("Invalid batch size. Must be a positive integer larger than 0")
  })
})

describe("validatePrivateKey", () => {
  it("should return true if the private key is valid", () => {
    const res = validatePrivateKey(getTestKey(0).pk.toString("hex"))

    expect(res).toBe(true)
  })

  it("should return a string if the private key is invalid", () => {
    const res = validatePrivateKey("not a private key")

    expect(res).toBe("Invalid private key")
  })
})

describe("validateKeystore", () => {
  it("should return true if the keystore is valid", async () => {
    const res = validateKeystore("test-keystore.json")

    expect(res).toBe(true)
  })

  it("should return a string if the keystore is invalid", async () => {
    const res = validateKeystore("invalid-keystore.json")

    expect(res).toBe("Failed to read keystore file. Please try again")
  })
})
