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

export const trimAddress = (fullAddress: string): string => {
  return `${fullAddress.slice(0, 4)}…${fullAddress.slice(-6)}`
}
