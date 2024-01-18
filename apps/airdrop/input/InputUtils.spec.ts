jest.mock("./UserInput", () => ({
  askUserForInput: jest.fn(),
}))

import { HexUtils } from "@repo/utils"
import { getTestKey } from "../test/utils/pks"
import {
  getAirdropType,
  getBatchSize,
  getGasPriceCoef,
  getInputFilePath,
  getKeyType,
  getKeystore,
  getNetworkConfig,
  getPrivateKey,
  unlockKeystore,
} from "./InputUtils"
import { askUserForInput } from "./UserInput"

// Cast to jest.Mock to get access to mock-specific properties
const mock = askUserForInput as jest.Mock

describe("getNetworkConfig", () => {
  beforeEach(() => {
    // Clear mock history before each test
    mock.mockClear()
  })

  it("should return the solo config", async () => {
    // Mock call to askUserForInput
    mock.mockResolvedValueOnce("solo")

    const config = await getNetworkConfig()

    expect(mock).toHaveBeenCalledTimes(1)
    expect(config.nodeUrl).toBe("http://localhost:8669")
  }, 5000)

  it("should ask the user again if they provide an invalid value", async () => {
    mock.mockResolvedValueOnce("invalid").mockResolvedValueOnce("solo")

    const config = await getNetworkConfig()

    expect(mock).toHaveBeenCalledTimes(2)
    expect(config.nodeUrl).toBe("http://localhost:8669")
  }, 5000)
})

describe("getAirdropType", () => {
  beforeEach(() => {
    // Clear mock history before each test
    mock.mockClear()
  })

  it("should return the transfer type", async () => {
    // Mock call to askUserForInput
    mock.mockResolvedValueOnce("transfer")

    const type = await getAirdropType()

    expect(mock).toHaveBeenCalledTimes(1)
    expect(type).toBe("transfer")
  }, 5000)

  it("should return the mint type", async () => {
    // Mock call to askUserForInput
    mock.mockResolvedValueOnce("mint")

    const type = await getAirdropType()

    expect(mock).toHaveBeenCalledTimes(1)
    expect(type).toBe("mint")
  }, 5000)

  it("should ask the user again if they provide an invalid value", async () => {
    // Mock call to askUserForInput
    mock.mockResolvedValueOnce("invalid").mockResolvedValueOnce("mint")

    const type = await getAirdropType()

    expect(mock).toHaveBeenCalledTimes(2)
    expect(type).toBe("mint")
  }, 5000)
})

describe("getInputFilePath", () => {
  beforeEach(() => {
    // Clear mock history before each test
    mock.mockClear()
  })

  it("should return the input file path", async () => {
    // Mock call to askUserForInput
    mock.mockResolvedValueOnce("./test/data/input-fund-pool.json")

    const path = await getInputFilePath()

    expect(mock).toHaveBeenCalledTimes(1)
    expect(path).toBe("./test/data/input-fund-pool.json")
  }, 5000)

  it("should ask the user again if they provide an invalid value", async () => {
    // Mock call to askUserForInput
    mock.mockResolvedValueOnce("invalid").mockResolvedValueOnce("./test/data/input-fund-pool.json")

    const path = await getInputFilePath()

    expect(mock).toHaveBeenCalledTimes(2)
    expect(path).toBe("./test/data/input-fund-pool.json")
  }, 5000)

  it("should ask the user again if the file doesn't pass validation", async () => {
    // Mock call to askUserForInput
    mock
      .mockResolvedValueOnce("./test/data/input-invalid-address.json")
      .mockResolvedValueOnce("./test/data/input-fund-pool.json")

    const path = await getInputFilePath()

    expect(mock).toHaveBeenCalledTimes(2)
    expect(path).toBe("./test/data/input-fund-pool.json")
  }, 5000)
})

describe("getGasPriceCoef", () => {
  beforeEach(() => {
    // Clear mock history before each test
    mock.mockClear()
  })

  it("should return the gas price coefficient", async () => {
    // Mock call to askUserForInput
    mock.mockResolvedValueOnce("128")

    const gasPriceCoef = await getGasPriceCoef()

    expect(mock).toHaveBeenCalledTimes(1)
    expect(gasPriceCoef).toBe(128)
  }, 5000)

  it("should ask the user again if they provide an invalid value", async () => {
    // Mock call to askUserForInput
    mock.mockResolvedValueOnce("invalid").mockResolvedValueOnce("128")

    const gasPriceCoef = await getGasPriceCoef()

    expect(mock).toHaveBeenCalledTimes(2)
    expect(gasPriceCoef).toBe(128)
  }, 5000)
})

describe("getBatchSize", () => {
  beforeEach(() => {
    // Clear mock history before each test
    mock.mockClear()
  })

  it("should return the batch size", async () => {
    // Mock call to askUserForInput
    mock.mockResolvedValueOnce("128")

    const batchSize = await getBatchSize()

    expect(mock).toHaveBeenCalledTimes(1)
    expect(batchSize).toBe(128)
  }, 5000)

  it("should ask the user again if they provide an invalid value", async () => {
    // Mock call to askUserForInput
    mock.mockResolvedValueOnce("invalid").mockResolvedValueOnce("128")

    const batchSize = await getBatchSize()

    expect(mock).toHaveBeenCalledTimes(2)
    expect(batchSize).toBe(128)
  }, 5000)
})

describe("getKeyType", () => {
  beforeEach(() => {
    // Clear mock history before each test
    mock.mockClear()
  })

  it("should return the key type", async () => {
    // Mock call to askUserForInput
    mock.mockResolvedValueOnce("keystore")

    const keyType = await getKeyType()

    expect(mock).toHaveBeenCalledTimes(1)
    expect(keyType).toBe("keystore")
  }, 5000)

  it("should return the key type", async () => {
    // Mock call to askUserForInput
    mock.mockResolvedValueOnce("pk")

    const keyType = await getKeyType()

    expect(mock).toHaveBeenCalledTimes(1)
    expect(keyType).toBe("pk")
  }, 5000)

  it("should ask the user again if they provide an invalid value", async () => {
    // Mock call to askUserForInput
    mock.mockResolvedValueOnce("invalid").mockResolvedValueOnce("keystore")

    const keyType = await getKeyType()

    expect(mock).toHaveBeenCalledTimes(2)
    expect(keyType).toBe("keystore")
  }, 5000)
})

describe("getPrivateKey", () => {
  beforeEach(() => {
    // Clear mock history before each test
    mock.mockClear()
  })

  it("should return the private key", async () => {
    const key = getTestKey(1)
    // Mock call to askUserForInput
    mock.mockResolvedValueOnce(key.pk.toString("hex"))

    const privateKey = await getPrivateKey()

    expect(mock).toHaveBeenCalledTimes(1)
    expect(privateKey.toString("hex")).toBe(key.pk.toString("hex"))
  }, 5000)

  it("hex with prefix should return the private key", async () => {
    const key = getTestKey(1)
    // Mock call to askUserForInput
    mock.mockResolvedValueOnce(HexUtils.addPrefix(key.pk.toString("hex")))

    const privateKey = await getPrivateKey()

    expect(mock).toHaveBeenCalledTimes(1)
    expect(privateKey.toString("hex")).toBe(key.pk.toString("hex"))
  }, 5000)

  it("should ask the user again if they provide an invalid value", async () => {
    const key = getTestKey(1)
    // Mock call to askUserForInput
    mock.mockResolvedValueOnce("invalid").mockResolvedValueOnce(key.pk.toString("hex"))

    const privateKey = await getPrivateKey()

    expect(mock).toHaveBeenCalledTimes(2)
    expect(privateKey.toString("hex")).toBe(key.pk.toString("hex"))
  }, 5000)
})

describe("getKeystore and unlockKeystore", () => {
  beforeEach(() => {
    // Clear mock history before each test
    mock.mockClear()
  })
  it("valid keystore path and password should return the private key", async () => {
    const key = getTestKey(0)
    // Mock call to askUserForInput
    mock.mockResolvedValueOnce("./test/test-keystore.json").mockResolvedValueOnce("Password1!")

    const keystore = await getKeystore()
    const privateKey = await unlockKeystore(keystore)

    expect(mock).toHaveBeenCalledTimes(2)
    expect(privateKey.toString("hex")).toBe(key.pk.toString("hex"))
  }, 5000)

  it("invalid keystore path should ask the user again", async () => {
    // Mock call to askUserForInput
    mock.mockResolvedValueOnce("invalid").mockResolvedValueOnce("./test/test-keystore.json")

    await getKeystore()

    expect(mock).toHaveBeenCalledTimes(2)
  }, 5000)

  it("invalid password should ask the user again", async () => {
    const key = getTestKey(0)
    // Mock call to askUserForInput
    mock
      .mockResolvedValueOnce("./test/test-keystore.json")
      .mockResolvedValueOnce("invalid")
      .mockResolvedValueOnce("Password1!")

    const keystore = await getKeystore()
    const privateKey = await unlockKeystore(keystore)

    expect(mock).toHaveBeenCalledTimes(3)
    expect(privateKey.toString("hex")).toBe(key.pk.toString("hex"))
  }, 5000)
})
