/**
 * Takes an integer and formats it into a compacted string. E.g. 200000 -> 200K
 * The output is the same to what's displayed in the UI.
 * @param number
 * @returns string
 */
export const compact = (number: number | bigint): string => {
  const getCompactFormatter = (decimalPlaces?: number) =>
    new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: decimalPlaces,
    })

  return getCompactFormatter(4).format(number)
}

export const expand = (compactString: string): number => {
  // Define the multipliers for different compact notations
  const multipliers: Record<string, number> = {
    K: 1_000, // Kilo -> 1,000
    M: 1_000_000, // Million -> 1,000,000
    B: 1_000_000_000, // Billion -> 1,000,000,000
    T: 1_000_000_000_000, // Trillion -> 1,000,000,000,000
  }

  // Regular expression to match the number part and the suffix
  const regex = /^([\d,.]+)([KMBT]?)$/i

  // Check if the input matches the format
  const match = compactString.match(regex)
  if (!match) throw new Error("Invalid input format")

  const numberPart = parseFloat(match[1].replace(/,/g, "")) // Convert the numeric part to a number (handles commas)
  const suffix = match[2].toUpperCase() // Get the suffix and convert it to uppercase

  // Multiply the numberPart by the appropriate multiplier, or just return the number if there's no suffix
  const multiplier = multipliers[suffix] || 1

  return numberPart * multiplier
}

/**
 * Trims full wallet address to a shorter version in same way it's displayed in the UI on a Connect Wallet button.
 * @param fullAddress
 */
export const trimAddress = (fullAddress: string): string => {
  return `${fullAddress.slice(0, 4)}…${fullAddress.slice(-6)}`
}
