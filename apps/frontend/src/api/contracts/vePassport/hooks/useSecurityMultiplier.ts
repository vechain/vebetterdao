import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const abi = VeBetterPassport__factory.abi
const address = getConfig().veBetterPassportContractAddress
const method = "securityMultiplier" as const

export enum SecurityLevel {
  NONE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
}

export const getSecurityMultiplierQueryKey = (securityLevel: SecurityLevel) => {
  return getCallClauseQueryKeyWithArgs({ abi, address, method, args: [securityLevel] })
}

/**
 * Hook to get the security multiplier of an app
 * @param securityLevel - the security level of the app
 * @returns the security multiplier of the app as a number
 */
export const useSecurityMultiplier = (securityLevel: SecurityLevel) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [securityLevel],
    queryOptions: {
      enabled: !!securityLevel,
      select: data => Number(data[0]),
    },
  })
}
