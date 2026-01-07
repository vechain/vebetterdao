import { Address } from "@vechain/sdk-core"

/**
 * Parse the dryRun flag from a Lambda event payload
 * Supports both direct invocation (EventBridge) and API Gateway events
 * @param event - The Lambda event object
 * @returns The parsed dryRun flag (defaults to false if not found or parsing fails)
 */
export const parseDryRunFlag = (event: any): boolean => {
  try {
    // Check direct event property (for EventBridge/direct invocation)
    if (event.dryRun !== undefined) {
      return event.dryRun === true
    }

    // Check body property (for API Gateway)
    if (event.body) {
      const body = JSON.parse(event.body)
      return body.dryRun === true
    }

    // Default to false if not found
    return false
  } catch {
    // If parsing fails, default to false
    return false
  }
}

/**
 * Parse the batchSize from a Lambda event payload
 * Supports both direct invocation (EventBridge) and API Gateway events
 * @param event - The Lambda event object
 * @param defaultBatchSize - The default batch size to use if not provided (defaults to 50)
 * @returns The parsed batch size (defaults to defaultBatchSize if not found or parsing fails)
 */
export const parseBatchSize = (event: any, defaultBatchSize: number = 50): number => {
  try {
    // Check direct event property (for EventBridge/direct invocation)
    if (event.batchSize !== undefined) {
      const batchSize = Number(event.batchSize)
      // Validate it's a positive number
      if (!isNaN(batchSize) && batchSize > 0 && batchSize <= 200) {
        return batchSize
      }
    }

    // Check body property (for API Gateway)
    if (event.body) {
      const body = JSON.parse(event.body)
      if (body.batchSize !== undefined) {
        const batchSize = Number(body.batchSize)
        // Validate it's a positive number
        if (!isNaN(batchSize) && batchSize > 0 && batchSize <= 200) {
          return batchSize
        }
      }
    }

    // Default to provided default
    return defaultBatchSize
  } catch {
    // If parsing fails, default to provided default
    return defaultBatchSize
  }
}

/**
 * Validates if a string is a valid Ethereum/VeChain address using VeChain SDK
 * @param address - The address to validate
 * @returns True if valid, false otherwise
 */
const isValidAddress = (address: string): boolean => {
  try {
    // Use VeChain SDK's Address.of() which throws on invalid addresses
    Address.of(address)
    return true
  } catch {
    return false
  }
}

/**
 * Parse wallet addresses from a Lambda event payload
 * Supports both direct invocation (EventBridge) and API Gateway events
 * @param event - The Lambda event object
 * @returns Array of valid wallet addresses (checksummed), or undefined if not provided
 */
export const parseWalletAddresses = (event: any): string[] | undefined => {
  try {
    let wallets: any

    // Check direct event property (for EventBridge/direct invocation)
    if (event.wallets !== undefined) {
      wallets = event.wallets
    }
    // Check body property (for API Gateway)
    else if (event.body) {
      const body = JSON.parse(event.body)
      wallets = body.wallets
    }

    // If no wallets provided, return undefined
    if (!wallets) {
      return undefined
    }

    // Handle single wallet as string
    if (typeof wallets === "string") {
      if (isValidAddress(wallets)) {
        // Normalize to checksummed format
        return [Address.of(wallets).toString()]
      }
      return undefined
    }

    // Handle array of wallets
    if (Array.isArray(wallets)) {
      const validAddresses = wallets
        .filter(addr => typeof addr === "string" && isValidAddress(addr))
        .map(addr => Address.of(addr).toString()) // Normalize to checksummed format

      return validAddresses.length > 0 ? validAddresses : undefined
    }

    return undefined
  } catch {
    // If parsing fails, return undefined
    return undefined
  }
}
