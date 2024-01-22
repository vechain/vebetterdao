import enquirer from "enquirer"

import { HexUtils } from "@repo/utils"
import { getTestKey } from "../../test/utils/pks"
import {
  getAirdropType,
  getBatchSize,
  getGasPriceCoef,
  getInputFilePath,
  getKeyType,
  getNetworkConfig,
  getPrivateKey,
  getPrivateKeyFromKeystore,
} from "./InputUtils"
import { KeyType } from "../../env"
import { BASE_PATH } from "./PathUtils"

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
