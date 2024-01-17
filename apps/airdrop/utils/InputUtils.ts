import { HexUtils } from "@repo/utils"
import { Env, KeyType, Type } from "../model/env"
import * as readline from "readline"
import { logger } from "./Logger"
import { keystore, addressUtils, Keystore } from "@vechain/vechain-sdk-core"
import { Recipient, RecipientInput } from "../model/input"
import { Config, getConfig } from "@repo/config"
import fs from "fs"

const cleanPath = (path: string): string => {
  return path.replace(/['"]+/g, "").trim()
}

// Reads the input JSON file and returns an array of addresses
export const readInputFile = async (path: string): Promise<Recipient[]> => {
  // Remove surrounding quotes and whitespace if any
  path = cleanPath(path)

  // Read file
  const fileContents = fs.readFileSync(path, "utf8")

  // Parse JSON as RecipientInput
  const recipientInput = JSON.parse(fileContents) as RecipientInput
  if (!recipientInput.recipients) throw new Error("Input file does not contain recipients")

  // Return array of addresses
  return recipientInput.recipients
}

const askUserForInput = async (question: string, isSensitive = false, defaultValue?: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  if (isSensitive) {
    const listener = (char: string, key: any) => {
      if (key && key.name !== "enter" && key.name !== "return" && key.name !== "backspace") {
        readline.moveCursor(process.stdout, -1, 0)
        process.stdout.write("*")
      }
    }
    process.stdin.on("keypress", listener)

    rl.on("close", () => {
      process.stdin.removeListener("keypress", listener)
    })
  }

  let answer: string | undefined
  try {
    answer = await new Promise<string>((resolve, reject) => {
      rl.question(question, (res: string) => {
        if (!res && defaultValue) {
          res = defaultValue
          if (!isSensitive) process.stdout.write(`Using default value '${defaultValue}'\n`)
        }
        if (!res || res.trim() === "") reject(Error("No input provided"))
        resolve(res.trim())
      })
    })
    return answer
  } finally {
    process.stdout.write("\n")
    rl.close()
  }
}

const getNetworkConfig = async (): Promise<Config> => {
  const networkType = await askUserForInput(
    "What network would you like to use?\n - 'solo' for the solo network (default)\n - 'test' for the testnet (not supported yet)\n - 'main' for mainnet (not supported yet)\n",
  )
  try {
    const config = getConfig(networkType)
    if (!config) {
      throw new Error("Invalid network type")
    }
    return config
  } catch (e) {
    logger.error("Invalid network type. Please enter either 'solo', 'test' or 'main'\n")
    return await getNetworkConfig()
  }
}

const getAirdropType = async (): Promise<Type> => {
  const typeStr = await askUserForInput(
    "What type of airdrop would you like to do? \n - 'mint'\n - 'transfer' (default)\n",
    false,
    Type.TRANSFER,
  )
  const type = Object.values(Type).find(e => e === typeStr)
  if (!type) {
    logger.error(
      "Invalid airdrop type. Please enter either 'mint' or 'transfer' or leave it blank to default to 'transfer'\n",
    )
    return await getAirdropType()
  }
  return type
}

const getInputFilePath = async (): Promise<string> => {
  try {
    const path = await askUserForInput(
      "Where is your input file located? \n  - enter the file path or drag and drop the file\n",
    )

    // Validate path and file
    const recipients = await readInputFile(path)
    if (!recipients) throw new Error("No recipients found in input file")
    return path
  } catch (e) {
    logger.error("Please enter a valid input file location or drag and drop the file\n")
  }
  return await getInputFilePath()
}

const getGasPriceCoef = async (): Promise<number> => {
  const gasPriceCoefStr = await askUserForInput(
    "Please enter the gas price coefficient\n - enter a value between 0-255 or leave blank to default to 0\n",
    false,
    "0",
  )
  const gasPriceCoef = parseInt(gasPriceCoefStr)
  if (isNaN(gasPriceCoef)) {
    logger.error("Please enter a valid gas price coefficient or leave blank to default to 0\n")
    return await getGasPriceCoef()
  }
  return gasPriceCoef
}

const getBatchSize = async (): Promise<number> => {
  const batchSizeStr = await askUserForInput(
    "How many clauses would you like per transaction?\n - enter an integer value (default to 100)\n",
    false,
    "100",
  )
  const batchSize = parseInt(batchSizeStr)
  if (isNaN(batchSize)) {
    logger.error("Please enter a valid integer or leave blank to default to 100\n")
    return await getBatchSize()
  }
  return batchSize
}

/**
 * Ask the user what type of key they want to use: private key (pk) or keystore file (keystore)
 * defaults to keystore as it is the more secured and recommended option
 * @returns
 */
const getKeyType = async (): Promise<KeyType> => {
  try {
    const typeStr = await askUserForInput(
      "How would you like to sign the transactions?\n - 'pk' to use a private key \n - 'keystore' to use a keystore file (default)\n",
      false,
      KeyType.KEYSTORE,
    )
    const type = Object.values(KeyType).find(e => e === typeStr)
    if (!type) throw new Error("Invalid key type")
    return type
  } catch (e) {
    logger.error("Please enter 'pk' or 'keystore' or leave blank to default to 'keystore'\n")
    return await getKeyType()
  }
}

/**
 * Get the the private key from the user
 * @returns The private key as a Buffer
 */
const getPrivateKey = async (): Promise<Buffer> => {
  try {
    const pkStr = await askUserForInput(
      "\nPlease enter your private key\n - enter the hexadecimal value for your private key\n ",
      true,
    )
    const pk = Buffer.from(HexUtils.removePrefix(pkStr), "hex")
    // Validate the private key by trying to get the address
    addressUtils.fromPrivateKey(pk)
    return pk
  } catch (e) {
    logger.error("Please enter a valid hexadecimal private key\n")
    return await getPrivateKey()
  }
}

const getKeystore = async (): Promise<Keystore> => {
  try {
    const path = await askUserForInput(
      "Where is your keystore file located? \n - enter the file path or drag and drop the file\n",
    )
    // Validate path and file
    const fileContents = fs.readFileSync(cleanPath(path), "utf8")
    if (!fileContents) throw new Error("Invalid keystore file path")

    const ks = JSON.parse(fileContents) as Keystore

    if (!keystore.isValid(ks)) throw new Error("Invalid keystore file")
    return ks
  } catch (e) {
    logger.error("Please enter a valid keystore file location\n", e)
  }
  return await getKeystore()
}

const unlockKeystore = async (ks: Keystore): Promise<Buffer> => {
  try {
    const password = await askUserForInput(
      "\nUnlock your keystore file\n - enter the password to unlock your keystore file\n ",
      true,
    )
    const ksAccount = await keystore.decrypt(ks, password)
    return Buffer.from(HexUtils.removePrefix(ksAccount.privateKey), "hex")
  } catch (e) {
    logger.error("Failed to unlock the keystore file. Please try again.\n")
    return await unlockKeystore(ks)
  }
}

const getPrivateKeyFromKeystore = async (): Promise<Buffer> => {
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
    config,
  }
}
