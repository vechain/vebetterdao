/**
 * Wait function
 * @param {number} ms - number of milliseconds to wait for
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Trims the wallet address
 * @param address
 * @returns {string} - trimmed address in a format used for "user" button in the header
 */
const trimmedAddress = (address: string): string => {
  return `${address.substring(0, 4)}…${address.substring(address.length - 6)}`
}

export {
  delay,
  trimmedAddress,
}