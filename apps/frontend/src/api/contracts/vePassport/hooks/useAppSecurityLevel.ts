import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const abi = VeBetterPassport__factory.abi
const address = getConfig().veBetterPassportContractAddress
const method = "appSecurity" as const
export const APP_SECURITY_LEVELS = ["NONE", "LOW", "MEDIUM", "HIGH"]
export const getAppSecurityLevelQueryKey = (appId: string) => {
  return getCallClauseQueryKeyWithArgs({ abi, address, method, args: [appId as `0x${string}`] })
}
/**
 * Hook to get the security level of an app
 * @param appId - the app id
 * @returns the security level of the app as a number
 */
export const useAppSecurityLevel = (appId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [appId as `0x${string}`],
    queryOptions: {
      enabled: !!appId,
      select: data => data[0],
    },
  })
}
