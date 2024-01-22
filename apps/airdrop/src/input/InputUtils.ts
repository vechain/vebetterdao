import { HexUtils } from "@repo/utils"
import { Env, KeyType, Type, parseAirdropType } from "../../env"
import { logger } from "../logging/Logger"
import { keystore, Keystore } from "@vechain/vechain-sdk-core"
import { Config, getConfig } from "@repo/config"
import fs from "fs"
import { prompt } from "enquirer"
import { AirdropResponse } from "../airdrop"
import numeral from "numeral"
import { BASE_PATH, parsePath } from "./PathUtils"
import {
  validateBatchSize,
  validateGasPriceCoef,
  validateInputFilePath,
  validateKeystore,
  validatePrivateKey,
  validateUnlockKeystore,
} from "./InputValidation"
import { readKeystoreFile } from "./FileReader"

type Response = {
  answer: string
}

export const getNetworkConfig = async (): Promise<Config> => {
  const res = await prompt<Response>([
    {
      type: "select",
      name: "answer",
      message: "What network would you like to use?",
      choices: ["solo", "testnet", "mainnet"],
    },
  ])
  return getConfig(res.answer)
}

export const getAirdropType = async (): Promise<Type> => {
  const res = await prompt<Response>([
    {
      type: "select",
      name: "answer",
      message: "What type of airdrop would you like to do?",
      choices: [Type.MINT, Type.TRANSFER],
    },
  ])
  const type = parseAirdropType(res.answer)
  if (!type) throw new Error("Invalid airdrop type")
  return type
}

export const getInputFilePath = async (): Promise<string> => {
  logger.info(`Reading input files from: ${BASE_PATH}`)
  const files = fs.readdirSync(BASE_PATH)

  const response = await prompt<Response>({
    type: "select",
    name: "answer",
    message: "Select an input file containing the recipients and amounts",
    choices: files,
    validate: validateInputFilePath,
  })

  return parsePath(response.answer)
}

export const getGasPriceCoef = async (): Promise<number> => {
  const res = await prompt<Response>([
    {
      type: "input",
      name: "answer",
      message: "Gas price coefficient (0-255)",
      initial: 0,
      validate: validateGasPriceCoef,
    },
  ])

  const gasPriceCoef = parseInt(res.answer)
  if (isNaN(gasPriceCoef)) {
    logger.error("Please enter a valid gas price coefficient")
    return await getGasPriceCoef()
  }
  return gasPriceCoef
}

export const getBatchSize = async (): Promise<number> => {
  const res = await prompt<Response>([
    {
      type: "input",
      name: "answer",
      message: "How many clauses would you like per transaction?",
      initial: 100,
      validate: validateBatchSize,
    },
  ])

  const batchSize = parseInt(res.answer)
  if (isNaN(batchSize)) {
    logger.error("Please enter a valid integer or leave blank to default to 100")
    return await getBatchSize()
  }
  return batchSize
}

/**
 * Ask the user what type of key they want to use: private key (pk) or keystore file (keystore)
 * defaults to keystore as it is the more secured and recommended option
 * @returns
 */
export const getKeyType = async (): Promise<KeyType> => {
  const res = await prompt<Response>([
    {
      type: "select",
      name: "answer",
      message: "How would you like to sign the transactions?",
      choices: [KeyType.KEYSTORE, KeyType.PRIVATE_KEY],
    },
  ])

  const type = Object.values(KeyType).find(e => e === res.answer)
  if (!type) throw new Error("Invalid key type")
  return type
}

/**
 * Get the the private key from the user
 * @returns The private key as a Buffer
 */
export const getPrivateKey = async (): Promise<Buffer> => {
  const res = await prompt<Response>([
    {
      type: "password",
      name: "answer",
      message: "Please enter your private key",
      validate: validatePrivateKey,
    },
  ])

  return Buffer.from(HexUtils.removePrefix(res.answer), "hex")
}

export const getKeystore = async (): Promise<Keystore> => {
  const files = fs.readdirSync(BASE_PATH)

  const response = await prompt<Response>({
    type: "select",
    name: "answer",
    message: "Select a keystore file",
    choices: files,
    validate: validateKeystore,
  })

  const path = parsePath(response.answer)

  return readKeystoreFile(path)
}

export const unlockKeystore = async (ks: Keystore): Promise<Buffer> => {
  const res = await prompt<Response>([
    {
      type: "password",
      name: "answer",
      message: "Unlock your keystore",
      validate: async (password: string) => await validateUnlockKeystore(password, ks),
    },
  ])

  const acct = await keystore.decrypt(ks, res.answer)

  return Buffer.from(HexUtils.removePrefix(acct.privateKey), "hex")
}

export const getPrivateKeyFromKeystore = async (): Promise<Buffer> => {
  const ks = await getKeystore()
  return await unlockKeystore(ks)
}

const getKey = async (keyType: KeyType): Promise<Buffer> => {
  if (keyType === KeyType.KEYSTORE) {
    return await getPrivateKeyFromKeystore()
  } else if (keyType === KeyType.PRIVATE_KEY) {
    return await getPrivateKey()
  }

  throw new Error("Invalid key type")
}

export const confirmAirdrop = async (simRes: AirdropResponse): Promise<boolean> => {
  const res = await prompt<Response>([
    {
      type: "select",
      name: "answer",
      message: `${numeral(simRes.totalAmount).format("0,0")} tokens with be airdropped to ${numeral(simRes.numRecipients).format("0,0")} recipients. Proceed?`,
      choices: ["No", "Yes"],
    },
  ])

  return res.answer === "Yes"
}

export const getUserInput = async (): Promise<Env> => {
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

  // Get the type of key the user wants to use private key (pk) or keystore file (keystore)
  const keyType = await getKeyType()

  // Get private key from env variable
  const pk = await getKey(keyType)

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
