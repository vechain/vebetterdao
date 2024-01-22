import { HexUtils } from "@repo/utils"
import { Recipient } from "../recipient/recipient"
import { readInputFile, readKeystoreFile } from "./FileReader"
import { parsePath } from "./PathUtils"
import { Keystore, addressUtils, keystore } from "@vechain/vechain-sdk-core"
import { validateRecipients } from "../recipient/RecipientValidator"

export const validateInputFilePath = async (path: string): Promise<boolean | string> => {
  let recipients: Recipient[] = []
  try {
    // Validate path and file
    recipients = await readInputFile(parsePath(path))
  } catch (e) {
    return "Failed to load input file. Please try again"
  }

  // Run validation on the recipients
  const problems = validateRecipients(recipients)
  if (problems.length > 0) {
    let message = "The input file failed to pass validation:"
    for (const problem of problems) {
      message = `${message}\n - ${problem}`
    }
    return message
  }
  return true
}

export const validateGasPriceCoef = (gasPriceCoef: string): boolean | string => {
  const gasPriceCoefInt = parseInt(gasPriceCoef)
  if (isNaN(gasPriceCoefInt) || gasPriceCoefInt < 0 || gasPriceCoefInt > 255) {
    return "Invalid coefficient. Must be an integer in the range 0-255"
  }
  return true
}

export const validateBatchSize = (batchSize: string): boolean | string => {
  const batchSizeInt = parseInt(batchSize)
  if (isNaN(batchSizeInt) || batchSizeInt < 1) {
    return "Invalid batch size. Must be a positive integer larger than 0"
  }
  return true
}

export const validatePrivateKey = (pk: string): boolean | string => {
  try {
    const pkBuf = Buffer.from(HexUtils.removePrefix(pk), "hex")
    // Validate the private key by trying to get the address
    addressUtils.fromPrivateKey(pkBuf)
    return true
  } catch (e) {
    return "Invalid private key"
  }
}

export const validateKeystore = (file: string): boolean | string => {
  try {
    const ks = readKeystoreFile(parsePath(file))
    if (!keystore.isValid(ks)) return "Invalid keystore file. Please try again"
    return true
  } catch (e) {
    return "Failed to read keystore file. Please try again"
  }
}

export const validateUnlockKeystore = async (password: string, ks: Keystore): Promise<boolean | string> => {
  try {
    await keystore.decrypt(ks, password)
    return true
  } catch (e) {
    return "Invalid password. Please try again"
  }
}
