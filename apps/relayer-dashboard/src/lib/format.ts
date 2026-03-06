import { formatEther } from "viem"

/** Format a raw token wei value to a human-readable string with locale separators. */
export function formatToken(rawValue: string, decimals = 2): string {
  const value = Number(formatEther(BigInt(rawValue)))
  return value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
