import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts"
import { useCallback, useMemo } from "react"

import { getIsPassportCheckEnabledQueryKey } from "../api/contracts/vePassport/hooks/useIsPassportCheckEnabled"
import { TogglePassportCheck } from "../constants/Passport"

import { useBuildTransaction } from "./useBuildTransaction"

import { buildClause } from "@/utils/buildClause"

const VeBetterPassportInterface = VeBetterPassport__factory.createInterface()
const VE_BETTER_PASSPORT_ADDRESS = getConfig().veBetterPassportContractAddress
const method = "toggleCheck"
type Props = {
  checkToToggle: TogglePassportCheck
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}
/**
 * Toggle a passport check in the VeBetterPassport contract
 *
 * @param {string} props.toggleFunction - the function to toggle
 * @param {string} props.checkFunction - the check function to invalidate
 * @returns the return value of the send transaction hook and the result of the transaction
 */
export const useTogglePassportCheck = ({ checkToToggle, onSuccess }: Props) => {
  const clauseBuilder = useCallback(() => {
    const clauses = buildClause({
      contractInterface: VeBetterPassportInterface,
      to: VE_BETTER_PASSPORT_ADDRESS,
      method: method,
      args: [checkToToggle],
      comment: `Toggle check with id ${checkToToggle}`,
    })
    return [clauses]
  }, [checkToToggle])
  const refetchQueryKeys = useMemo(() => [getIsPassportCheckEnabledQueryKey(checkToToggle)], [checkToToggle])
  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
