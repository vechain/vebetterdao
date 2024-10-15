import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"
import { TogglePassportCheck } from "@/constants"

const contractInterface = VeBetterPassport__factory.createInterface()
const contractAddress = getConfig().veBetterPassportContractAddress
const method = "isCheckEnabled"

export const getPassportToggleQueryKey = (checkName: TogglePassportCheck) => {
  return getCallKey({ method: method, keyArgs: [checkName] })
}
/**
 * Hook to get the status of a passport check
 * @param checkName - the function name of the check
 * @returns the status of the check as a boolean
 */
export const useIsPassportCheckEnabled = (checkName: TogglePassportCheck) => {
  return useCall({
    contractInterface,
    contractAddress,
    method: method,
    args: [checkName],
  })
}
