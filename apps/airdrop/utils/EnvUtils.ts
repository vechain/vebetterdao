import { HexUtils } from "@repo/utils"
import { config } from "dotenv"
import { Env, Type } from "../model/env"

config()

export const loadEnvVariables = (): Env => {
  // Get type from env variable and map it to the enum
  const typeStr = process.env.AIRDROP_TYPE
  if (!typeStr) throw new Error("AIRDROP_TYPE is not set")
  const type = Object.values(Type).find(e => e === typeStr)
  if (!type) throw new Error(`Invalid AIRDROP_TYPE: ${typeStr}`)

  // Get path from env variable
  const recipientInputFilePath = process.env.INPUT_FILE
  if (!recipientInputFilePath) throw new Error("INPUT_FILE is not set")

  if (!process.env.SIGNING_PK) throw new Error("SIGNING_PK is not set")
  const pk = Buffer.from(HexUtils.removePrefix(process.env.SIGNING_PK), "hex")

  // If no gas price coefficient is set, default to 0
  const gasPriceCoef = process.env.GAS_PRICE_COEF ? parseInt(process.env.GAS_PRICE_COEF) : 0

  // Get batch size from env variable, default to 100
  const batchSize = process.env.MAX_CLAUSES_PER_TX ? parseInt(process.env.MAX_CLAUSES_PER_TX) : 100

  return {
    type,
    recipientInputFilePath,
    batchSize,
    pk,
    gasPriceCoef,
  }
}
