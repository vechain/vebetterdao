import { config } from "@repo/config"
import { airdrop } from "../airdrop"
import { Env, Type } from "../model/env"
import { getTestKey } from "./utils/pks"
import { getBalance, getOrDeployB3tr } from "./utils/contract"
import { unitsUtils } from "@vechain/vechain-sdk-core"
import { logger } from "../utils/Logger"
import { readInputFile } from "../utils/InputUtils"

describe("airdrop - mint", () => {
  it("balances should be updated", async () => {
    const minter = getTestKey(1)
    const b3trContractAddress = await getOrDeployB3tr(minter.address, true)
    const inputFile = "./test/data/input-fund-pool.json"

    const env: Env = {
      type: Type.MINT,
      recipientInputFilePath: inputFile,
      batchSize: 3,
      pk: minter.pk,
      gasPriceCoef: 0,
    }

    await airdrop(env, config.nodeUrl, b3trContractAddress)

    const recipients = await readInputFile(inputFile)

    for (const r of recipients) {
      expect(await getBalance(b3trContractAddress, r.address)).toBe(unitsUtils.parseUnits(r.amount, 18))
    }
  }, 100000)
})

// This test has a dependency on the mint airdrop to fund the transfer account
describe("airdrop - transfer", () => {
  it("balances should be updated", async () => {
    const transferKey = getTestKey(3)
    const b3trContractAddress = await getOrDeployB3tr("", false)
    const inputFile = "./test/data/input-transfer-airdrop.json"
    logger.info(`Transfer key: ${transferKey.address}`)

    const env: Env = {
      type: Type.TRANSFER,
      recipientInputFilePath: "./test/data/input-transfer-airdrop.json",
      batchSize: 11,
      pk: transferKey.pk,
      gasPriceCoef: 128,
    }

    await airdrop(env, config.nodeUrl, b3trContractAddress)

    const recipients = await readInputFile(inputFile)

    for (const r of recipients) {
      expect(await getBalance(b3trContractAddress, r.address)).toBe(unitsUtils.parseUnits(r.amount, 18))
    }
  }, 100000)
})
