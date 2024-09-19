import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts"

const VeBetterPassportInterface = VeBetterPassport__factory.createInterface()

const VE_BETTER_PASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress

export type TogglePassportCheck =
  | "whitelistCheckEnabled"
  | "blacklistCheckEnabled"
  | "signalingCheckEnabled"
  | "participationScoreCheckEnabled"
  | "nodeOwnershipCheckEnabled"
  | "gmOwnershipCheckEnabled"

/**
 * Get the status of a passport check
 * @param thor - Connex thor instance
 * @param checkName - the function name of the check
 * @returns the status of the check as a boolean
 */
export const getIsPassportCheckEnabled = async (
  thor: Connex.Thor,
  checkName: TogglePassportCheck,
): Promise<boolean> => {
  const functionFragment = VeBetterPassportInterface.getFunction(checkName).format("json")
  const res = await thor.account(VE_BETTER_PASSPORT_CONTRACT).method(JSON.parse(functionFragment)).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return Boolean(res.decoded[0])
}

export const getPassportToggleQueryKey = (checkName: TogglePassportCheck) => ["vebetterpassport", checkName]

/**
 * Hook to get the status of a passport check
 * @param checkName - the function name of the check
 * @returns the status of the check as a boolean
 */
export const useIsPassportCheckEnabled = (checkName: TogglePassportCheck) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getPassportToggleQueryKey(checkName),
    queryFn: () => getIsPassportCheckEnabled(thor, checkName),
  })
}
