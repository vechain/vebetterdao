import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"

const contractInterface = VeBetterPassport__factory.createInterface()
const contractAddress = getConfig().veBetterPassportContractAddress
const method = "securityMultiplier"

export enum SecurityLevel {
  NONE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
}

export const getSecurityMultiplierQueryKey = (securityLevel: SecurityLevel) => {
  return getCallKey({ method, keyArgs: [securityLevel] })
}

/**
 * Hook to get the security multiplier of an app
 * @param securityLevel - the security level of the app
 * @returns the security multiplier of the app as a number
 */
export const useSecurityMultiplier = (securityLevel: SecurityLevel) => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [securityLevel],
    enabled: !!securityLevel,
  })
}
