import enquirer from "enquirer"

import { HexUtils } from "@repo/utils"
import { getTestKey } from "../test/utils/pks"
import {
  BASE_PATH,
  getAirdropType,
  getBatchSize,
  getGasPriceCoef,
  getInputFilePath,
  getKeyType,
  getNetworkConfig,
  getPrivateKey,
  getPrivateKeyFromKeystore,
  validateBatchSize,
  validateGasPriceCoef,
  validateInputFilePath,
  validateKeystore,
  validatePrivateKey,
} from "./InputUtils"
import { KeyType } from "../env"

describe("getNetworkConfig", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it("should return the solo config", async () => {
    // Mock call to askUserForInput
    jest.spyOn(enquirer, "prompt").mockResolvedValueOnce({ answer: "solo" })

    const config = await getNetworkConfig()

    // expect(mock).toHaveBeenCalledTimes(1)
    expect(config.nodeUrl).toBe("http://localhost:8669")
  }, 5000)
})

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

describe("getAirdropType", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("should return the transfer type", async () => {
    // Mock call to askUserForInput
    jest.spyOn(enquirer, "prompt").mockResolvedValueOnce({ answer: "transfer" })

    const type = await getAirdropType()

    expect(type).toBe("transfer")
  }, 5000)

  it("should return the mint type", async () => {
    // Mock call to askUserForInput
    jest.spyOn(enquirer, "prompt").mockResolvedValueOnce({ answer: "mint" })

    const type = await getAirdropType()

    expect(type).toBe("mint")
  }, 5000)
})

describe("getInputFilePath", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("should return the input file path", async () => {
    // Mock call to askUserForInput
    jest.spyOn(enquirer, "prompt").mockResolvedValueOnce({ answer: "input-fund-pool.json" })

    const path = await getInputFilePath()

    expect(path).toBe(`${BASE_PATH}/input-fund-pool.json`)
  }, 5000)
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

describe("getGasPriceCoef", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("should return the gas price coefficient", async () => {
    // Mock call to askUserForInput
    jest.spyOn(enquirer, "prompt").mockResolvedValueOnce({ answer: "128" })

    const gasPriceCoef = await getGasPriceCoef()

    expect(gasPriceCoef).toBe(128)
  }, 5000)
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

describe("getBatchSize", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("should return the batch size", async () => {
    // Mock call to askUserForInput
    jest.spyOn(enquirer, "prompt").mockResolvedValueOnce({ answer: "128" })

    const batchSize = await getBatchSize()

    expect(batchSize).toBe(128)
  }, 5000)
})

describe("getKeyType", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("should return the key type", async () => {
    // Mock call to askUserForInput
    jest.spyOn(enquirer, "prompt").mockResolvedValueOnce({ answer: KeyType.KEYSTORE })

    const keyType = await getKeyType()

    expect(keyType).toBe(KeyType.KEYSTORE)
  }, 5000)

  it("should return the key type", async () => {
    // Mock call to askUserForInput
    jest.spyOn(enquirer, "prompt").mockResolvedValueOnce({ answer: KeyType.PRIVATE_KEY })

    const keyType = await getKeyType()

    expect(keyType).toBe(KeyType.PRIVATE_KEY)
  }, 5000)
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

describe("getPrivateKey", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("should return the private key", async () => {
    const key = getTestKey(1)
    // Mock call to askUserForInput
    jest.spyOn(enquirer, "prompt").mockResolvedValueOnce({ answer: key.pk.toString("hex") })

    const privateKey = await getPrivateKey()

    expect(privateKey.toString("hex")).toBe(key.pk.toString("hex"))
  }, 5000)

  it("hex with prefix should return the private key", async () => {
    const key = getTestKey(1)
    // Mock call to askUserForInput
    jest.spyOn(enquirer, "prompt").mockResolvedValueOnce({ answer: HexUtils.addPrefix(key.pk.toString("hex")) })

    const privateKey = await getPrivateKey()

    expect(privateKey.toString("hex")).toBe(key.pk.toString("hex"))
  }, 5000)
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

describe("getPrivateKeyFromKeystore", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it("valid keystore path and password should return the private key", async () => {
    const key = getTestKey(0)
    // Mock call to askUserForInput
    jest
      .spyOn(enquirer, "prompt")
      .mockResolvedValueOnce({ answer: "test-keystore.json" })
      .mockResolvedValueOnce({ answer: "Password1!" })

    const privateKey = await getPrivateKeyFromKeystore()

    expect(privateKey.toString("hex")).toBe(key.pk.toString("hex"))
  }, 5000)
})
