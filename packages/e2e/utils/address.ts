/**
 * Trims the wallet address
 * @param address
 * @returns {string} - trimmed address in a format used for "user" button in the header
 */
export const trimmedAddress = (address: string): string => {
  return `${address.substring(0, 4)}…${address.substring(address.length - 6)}`
}