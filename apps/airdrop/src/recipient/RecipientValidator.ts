import { HexUtils } from "@repo/utils"
import { Recipient } from "./recipient"
import { addressUtils } from "@vechain/vechain-sdk-core"

// Verifies the recipients and returns a list of problems as strings
export const validateRecipients = (recipients: Recipient[]): string[] => {
  const problems: string[] = []

  // Check that all addresses and amounts are valid
  for (const r of recipients) {
    if (!addressUtils.isAddress(r.address)) {
      problems.push(`Invalid address: ${r.address}`)
    }
    if (!verifyAmount(r.amount)) {
      problems.push(`Invalid amount: ${r.amount}`)
    }
  }

  // Only run the duplicate check if the above checks passed
  if (problems.length > 0) {
    return problems
  }

  // Verify no duplicate addresses
  if (containsDuplicates(recipients)) {
    problems.push("Duplicate addresses found. Please ensure all addresses are unique.")
  }

  return problems
}

// Returns true if the recipients contain duplicate addresses
export const containsDuplicates = (recipients: Recipient[]): boolean => {
  const addresses = recipients.map(r => HexUtils.normalize(r.address))
  const uniqueAddresses = [...new Set(addresses)]
  return uniqueAddresses.length !== addresses.length
}

// Verifies the amount is a string representing a valid integer n (0 > n > 10^9)
export const verifyAmount = (amount: string): boolean =>
  amount.match(/^[0-9]+$/) !== null && parseInt(amount) > 0 && parseInt(amount) < 1_000_000_000
