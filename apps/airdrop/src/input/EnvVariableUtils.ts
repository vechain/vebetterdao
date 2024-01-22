import { HexUtils } from "@repo/utils"
import { config } from "dotenv"
import { Env, Type, parseAirdropType } from "../../env"
import { Config, getConfig } from "@repo/config"
import { validate } from "numeral"
import { validateBatchSize, validateGasPriceCoef, validateInputFilePath, validatePrivateKey } from "./InputValidation"

config()

export const getNetworkConfig = async (): Promise<Config> => {
  const networkType = process.env.NETWORK_TYPE
  if (!networkType) throw new Error("NETWORK_TYPE is not set")
  return getConfig(networkType)
}

export const getAirdropType = async (): Promise<Type> => {
  const typeStr = process.env.AIRDROP_TYPE
  if (!typeStr) throw new Error("AIRDROP_TYPE is not set")
  return parseAirdropType(typeStr)
}

export const getInputFilePath = async (): Promise<string> => {
  const recipientInputFilePath = process.env.INPUT_FILE
  if (!recipientInputFilePath) throw new Error("INPUT_FILE is not set")

  const res = await validateInputFilePath(recipientInputFilePath)

  if (res === false) throw new Error("Invalid input file path")
  else if (res !== true) throw new Error(res)
  return recipientInputFilePath
}

export const getGasPriceCoef = async (): Promise<number> => {
  const gasPriceCoef = process.env.GAS_PRICE_COEF
  if (!gasPriceCoef) return 0

  const res = validateGasPriceCoef(gasPriceCoef)

  if (res === false) throw new Error("Invalid gas price coefficient")
  else if (res !== true) throw new Error(res)

  return parseInt(gasPriceCoef)
}

export const getBatchSize = async (): Promise<number> => {
  const batchSize = process.env.BATCH_SIZE
  if (!batchSize) return 100

  const res = validateBatchSize(batchSize)

  if (res === false) throw new Error("Invalid batch size")
  else if (res !== true) throw new Error(res)

  return parseInt(batchSize)
}

export const getPrivateKey = async (): Promise<Buffer> => {
  const pk = process.env.SIGNING_PK
  if (!pk) throw new Error("SIGNING_PK is not set")

  const res = validatePrivateKey(pk)

  if (res === false) throw new Error("Invalid private key")
  else if (res !== true) throw new Error(res)

  return Buffer.from(HexUtils.removePrefix(pk), "hex")
}

export const loadEnvVariables = async (): Promise<Env> => {
  // Get network config
  const config = await getNetworkConfig()

  // Get type from env variable and map it to the enum
  const type = await getAirdropType()

  // Get path from env variable
  const recipientInputFilePath = await getInputFilePath()

  // If no gas price coefficient is set, default to 0
  const gasPriceCoef = await getGasPriceCoef()

  // Get batch size from env variable, default to 100
  const batchSize = await getBatchSize()

  // Gwt private key from env variable
  const pk = await getPrivateKey()

  return {
    type,
    recipientInputFilePath,
    batchSize,
    pk,
    gasPriceCoef,
    nodeUrl: config.nodeUrl,
    b3trContractAddress: config.b3trContractAddress,
    networkType: config.network.type,
  }
}
