import { HexUtils } from "@repo/utils"
import { Env, KeyType, Type } from "../env"
import { logger } from "../logging/Logger"
import { keystore, addressUtils, Keystore } from "@vechain/vechain-sdk-core"
import { Config, getConfig } from "@repo/config"
import { askUserForInput } from "./UserInput"
import { readInputFile, readKeystoreFile } from "./FileReader"
import { validateRecipients } from "../recipient/RecipientValidator"
import { Recipient } from "../recipient/recipient"

export const getNetworkConfig = async (): Promise<Config> => {
  const networkType = await askUserForInput(
    "What network would you like to use?\n - 'solo' for the solo network (default)\n - 'test' for the testnet (not supported yet)\n - 'main' for mainnet (not supported yet)\n",
    false,
    "solo",
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

export const getAirdropType = async (): Promise<Type> => {
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

export const getInputFilePath = async (): Promise<string> => {
  const path = await askUserForInput(
    "Where is your input file located? \n  - enter the file path or drag and drop the file\n",
  )

  let recipients: Recipient[] = []
  try {
    // Validate path and file
    recipients = await readInputFile(path)
  } catch (e) {
    logger.error("Failed to load input file. Please try again\n", e)
    return await getInputFilePath()
  }

  if (!recipients) {
    logger.error("No recipients found in the input file. Please try again\n")
    return await getInputFilePath()
  }

  // Run validation on the recipients
  const problems = validateRecipients(recipients)

  if (problems.length > 0) {
    logger.warn("The input file failed to pass validation:")
    for (const problem of problems) {
      logger.warn(` - ${problem}`)
    }
    logger.info("\n")
    return await getInputFilePath()
  }

  return path
}

export const getGasPriceCoef = async (): Promise<number> => {
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

export const getBatchSize = async (): Promise<number> => {
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
export const getKeyType = async (): Promise<KeyType> => {
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
export const getPrivateKey = async (): Promise<Buffer> => {
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

export const getKeystore = async (): Promise<Keystore> => {
  try {
    const path = await askUserForInput(
      "Where is your keystore file located? \n - enter the file path or drag and drop the file\n",
    )
    // Validate path and file
    const ks = readKeystoreFile(path)

    if (!keystore.isValid(ks)) throw new Error("Invalid keystore file")
    return ks
  } catch (e) {
    logger.error("Please enter a valid keystore file location\n", e)
  }
  return await getKeystore()
}

export const unlockKeystore = async (ks: Keystore): Promise<Buffer> => {
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
    nodeUrl: config.nodeUrl,
    b3trContractAddress: config.b3trContractAddress,
  }
}
