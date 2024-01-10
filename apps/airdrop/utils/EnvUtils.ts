import { HexUtils } from "@repo/utils"
import { config } from "dotenv"

config()

export interface Env {
  recipientInputFilePath: string
  pk: Buffer
  gasPriceCoef: number
}

export const loadEnvVariables = (): Env => {
  // Get path from env variable
  const recipientInputFilePath = process.env.INPUT_FILE
  if (!recipientInputFilePath) throw new Error("INPUT_FILE is not set")

  if (!process.env.SIGNING_PK) throw new Error("SIGNING_PK is not set")
  const pk = Buffer.from(HexUtils.removePrefix(process.env.SIGNING_PK), "hex")

  // If no gas price coefficient is set, default to 0
  const gasPriceCoef = process.env.GAS_PRICE_COEF ? parseInt(process.env.GAS_PRICE_COEF) : 0

  return {
    recipientInputFilePath,
    pk,
    gasPriceCoef,
  }
}
