import { UseSendTransactionReturnValue } from "./useSendTransaction"
import { useCallback, useMemo } from "react"
import { VeBetterPassport__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { getPassportToggleQueryKey, TogglePassportCheck } from "@/api"
import { buildClause } from "@/utils/buildClause"
import { useBuildTransaction } from "./useBuildTransaction"

const VeBetterPassportInterface = VeBetterPassport__factory.createInterface()

const VE_BETTER_PASSPORT_ADDRESS = getConfig().veBetterPassportContractAddress

export type TogglePassportFunction =
  | "toggleWhitelistCheck"
  | "toggleBlacklistCheck"
  | "toggleSignalingCheck"
  | "toggleParticipationScoreCheck"
  | "toggleNodeOwnershipCheck"
  | "toggleGMOwnershipCheck"

type Props = {
  toggleFunction: TogglePassportFunction
  checkFunction: TogglePassportCheck
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
export const useTogglePassportCheck = ({
  toggleFunction,
  checkFunction,
  onSuccess,
}: Props): UseSendTransactionReturnValue => {
  const clauseBuilder = useCallback(() => {
    const clauses = buildClause({
      contractInterface: VeBetterPassportInterface,
      to: VE_BETTER_PASSPORT_ADDRESS,
      method: toggleFunction,
      args: [],
      comment: `${toggleFunction}`,
    })

    return [clauses]
  }, [toggleFunction])

  const refetchQueryKeys = useMemo(() => [getPassportToggleQueryKey(checkFunction)], [checkFunction])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
