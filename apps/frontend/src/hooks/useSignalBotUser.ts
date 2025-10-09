import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { getUserBotSignalsQueryKey } from "../api/contracts/vePassport/hooks/useUserBotSignals"

import { useBuildTransaction } from "./useBuildTransaction"

const VeBetterPassportInterface = VeBetterPassport__factory.createInterface()
const VE_BETTER_PASSPORT_ADDRESS = getConfig().veBetterPassportContractAddress
type Props = {
  address: string
  reason: string
  onSuccess?: () => void
  onSuccessMessageTitle?: string
}
/**
 * Signal a user in the VeBetterPassport contract
 * @param {string} props.address - the user address
 * @param {string} props.reason - the reason for signaling the user
 * @returns  the return value of the send transaction hook and the result of the transaction
 */
export const useSignalBotUser = ({ address, reason, onSuccess }: Props) => {
  const clauseBuilder = useCallback(() => {
    const clauses = buildClause({
      contractInterface: VeBetterPassportInterface,
      to: VE_BETTER_PASSPORT_ADDRESS,
      method: "signalUserWithReason",
      args: [address, reason],
      comment: `Signal user ${address} with reason: ${reason}`,
    })
    return [clauses]
  }, [address, reason])
  const refetchQueryKeys = useMemo(() => [getUserBotSignalsQueryKey(address)], [address])
  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
