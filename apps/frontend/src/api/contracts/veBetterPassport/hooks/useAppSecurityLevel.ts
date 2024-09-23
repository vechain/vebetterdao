import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"

const contractInterface = VeBetterPassport__factory.createInterface()
const contractAddress = getConfig().veBetterPassportContractAddress
const method = "appSecurity"

export const APP_SECURITY_LEVELS = ["NONE", "LOW", "MEDIUM", "HIGH"]

export const getAppSecurityLevelQueryKey = (appId: string) => {
  getCallKey({ method, keyArgs: [appId] })
}

/**
 * Hook to get the security level of an app
 * @param appId - the app id
 * @returns the security level of the app as a number
 */
export const useAppSecurityLevel = (appId: string) => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [appId],
    enabled: !!appId,
  })
}
