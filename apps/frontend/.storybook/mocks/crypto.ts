// Mock crypto module for Storybook browser environment
export default {
  randomBytes: (size: number) => {
    const bytes = new Uint8Array(size)
    if (typeof window !== "undefined" && window.crypto) {
      window.crypto.getRandomValues(bytes)
    }
    return Buffer.from(bytes)
  },
}

// Also export as named exports for compatibility
export const randomBytes = (size: number) => {
  const bytes = new Uint8Array(size)
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(bytes)
  }
  return Buffer.from(bytes)
}
