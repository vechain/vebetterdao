import { useQuery } from "@tanstack/react-query"
import { getConfig } from "@repo/config"
import { useConnex } from "@vechain/dapp-kit-react"
import { VeBetterPassport__factory } from "@repo/contracts"

const VeBetterPassportInterface = VeBetterPassport__factory.createInterface()

const VE_BETTER_PASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress

export const APP_SECURITY_LEVELS = ["UNDEFINED", "NONE", "LOW", "MEDIUM", "HIGH"]

/**
 * Get the security level of an app
 * @param thor - Connex thor instance
 * @param appId - the app id
 * @returns the security level of the app as a number
 */
export const getAppSecurityLevel = async (thor: Connex.Thor, appId: string) => {
  const functionFragment = VeBetterPassportInterface.getFunction("appSecurity").format("json")
  const res = await thor.account(VE_BETTER_PASSPORT_CONTRACT).method(JSON.parse(functionFragment)).call(appId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return Number(res.decoded[0])
}

export const getAppSecurityLevelQueryKey = (appId: string) => ["vebetterpassport", "appSecurityLevel", appId]

/**
 * Hook to get the security level of an app
 * @param appId - the app id
 * @returns the security level of the app as a number
 */
export const useAppSecurityLevel = (appId: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAppSecurityLevelQueryKey(appId),
    queryFn: () => getAppSecurityLevel(thor, appId),
    enabled: !!thor,
  })
}
