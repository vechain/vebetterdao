import { address } from "thor-devkit"
import { HexUtils } from "@repo/utils"

/**
 * Checks if two addresses are equal. Returns true if both values are strings AND:
 *  - The two values are equal OR
 *  - The checksumed addresses are equal
 *
 * @param address1
 * @param address2
 */
export const compareAddresses = (address1: unknown, address2: unknown): boolean => {
  if (typeof address1 !== "string" || typeof address2 !== "string") return false

  if (address2 === address1) return true

  try {
    address1 = HexUtils.addPrefix(address1)
    address2 = HexUtils.addPrefix(address2)
    return address.toChecksumed(address1 as string) === address.toChecksumed(address2 as string)
  } catch {
    return false
  }
}

export const regexPattern = () => {
  return /^0x[a-fA-F0-9]{40}$/
}

export const isValid = (addr: string): boolean => {
  try {
    address.toChecksumed(HexUtils.addPrefix(addr))
    return true
  } catch {
    return false
  }
}
/**
 *  Parse the namespace from a WalletConnect session in order to extract chainId, genesisId, and address
 * namespace is in the format: chainId:genesisId@address
 * @example "vechain:b1ac3413d346d43539627e6be7ec1b4a:0x0f872421dc479f3c11edd89512731814d0598db5"
 * @param namespace
 * @returns {chainId, genesisId, address}
 */
export const ParseWalletConnectNamespace = (namespace: string) => {
  const [chainId, genesisId, address] = namespace.split(":")
  return { chainId, genesisId, address }
}
