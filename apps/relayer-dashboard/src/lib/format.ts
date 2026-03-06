import { formatEther } from "viem"

/** Format a raw token wei value to a human-readable string (e.g. "63,512.71"). */
export function formatToken(rawValue: string, decimals = 2): string {
  const value = Number(formatEther(BigInt(rawValue)))
  return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

/** Format a number with thousands separators (e.g. "1,680"). */
export function formatNumber(value: number): string {
  return value.toLocaleString("en-US")
}
