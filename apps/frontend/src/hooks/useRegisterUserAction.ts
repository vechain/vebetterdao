import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/factories/ve-better-passport/VeBetterPassport__factory"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { getIsPersonQueryKey } from "../api/contracts/vePassport/hooks/useIsPerson"

import { useBuildTransaction } from "./useBuildTransaction"

const VeBetterPassportInterface = VeBetterPassport__factory.createInterface()
const VE_BETTER_PASSPORT_ADDRESS = getConfig().veBetterPassportContractAddress
type Props = {
  address: string
  appId: string
  roundId?: number
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}
/**
 * Register a user action in the VeBetterPassport contract
 * @param {string} props.address - the address to register the action for
 * @param {string} props.appId - the app id to register the action for
 * @param {number} props.roundId - the round id to register the action for (optional)
 *
 * @returns the return value of the send transaction hook and the result of the transaction
 */
export const useRegisterUserAction = ({ address, appId, roundId, onSuccess }: Props) => {
  const clauseBuilder = useCallback(() => {
    const clauses = buildClause({
      contractInterface: VeBetterPassportInterface,
      to: VE_BETTER_PASSPORT_ADDRESS,
      method: roundId ? "registerActionForRound" : "registerAction",
      args: roundId ? [address, appId, roundId] : [address, appId],
      comment: `Register action for ${address} for app ${appId} in ${roundId ? `round ${roundId}` : "current round"}`,
    })
    return [clauses]
  }, [address, appId, roundId])
  const refetchQueryKeys = useMemo(() => [getIsPersonQueryKey(address)], [address])
  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
