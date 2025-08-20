import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { TogglePassportCheck } from "@/constants"

const address = getConfig().veBetterPassportContractAddress
const abi = VeBetterPassport__factory.abi
const method = "isCheckEnabled" as const

export const getIsPassportCheckEnabledQueryKey = (checkName: TogglePassportCheck) => {
  return getCallClauseQueryKeyWithArgs({ abi, address, method, args: [checkName] })
}

/**
 * Hook to get the passport check enabled status from the VeBetterPassport contract.
 * @param checkName - The check name.
 * @returns The passport check enabled status.
 */
export const useIsPassportCheckEnabled = (checkName: TogglePassportCheck) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [checkName],
    queryOptions: {
      select: data => data[0],
      enabled: checkName !== undefined,
    },
  })
}
