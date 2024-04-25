/**
 * Wait function
 * @param {number} ms - number of milliseconds to wait for
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))