import { Recipient, RecipientInput } from "../model/input"

// Reads the input JSON file and returns an array of addresses
export const readInputFile = async (path: string): Promise<Recipient[]> => {
  // Read file
  const fs = require("fs")
  const fileContents = fs.readFileSync(path, "utf8")

  // Parse JSON as RecipientInput
  const recipientInput = JSON.parse(fileContents) as RecipientInput
  if (!recipientInput.recipients) throw new Error("Input file does not contain recipients")

  // Return array of addresses
  return recipientInput.recipients
}
