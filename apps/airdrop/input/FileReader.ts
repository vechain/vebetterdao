import { Keystore } from "@vechain/vechain-sdk-core"
import { Recipient, RecipientInput } from "../recipient/recipient"
import fs from "fs"

export const cleanPath = (path: string): string => {
  return path.replace(/['"]+/g, "").trim()
}

// Attempts to read the contents of a file and returns the contents as a string
export const readFile = (path: string): string => {
  try {
    return fs.readFileSync(path, "utf8")
  } catch (e) {
    throw new Error(`Failed to load file. Please ensure the path is correct and the file exists at: ${path}`)
  }
}

// Reads the input JSON file and returns an array of addresses
export const readInputFile = async (path: string): Promise<Recipient[]> => {
  // Remove surrounding quotes and whitespace if any
  path = cleanPath(path)

  // Read file
  const fileContents = readFile(path)

  // Parse JSON as RecipientInput
  let recipientInput: RecipientInput
  try {
    recipientInput = JSON.parse(fileContents) as RecipientInput
  } catch (e) {
    throw new Error("Failed to parse input file. Please ensure the file contains valid JSON")
  }
  if (!recipientInput.recipients) throw new Error("Input file does not contain recipients")

  // Return array of addresses
  return recipientInput.recipients
}

// Reads the input JSON file and returns an array of addresses
export const readKeystoreFile = (path: string): Keystore => {
  const fileContents = readFile(path)

  try {
    return JSON.parse(fileContents) as Keystore
  } catch (e) {
    throw new Error("Failed to parse keystore file. Please ensure the file contains valid JSON")
  }
}
