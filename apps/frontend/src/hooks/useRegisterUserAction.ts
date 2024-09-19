import { UseSendTransactionReturnValue } from "./useSendTransaction"
import { useCallback, useMemo } from "react"
import { VeBetterPassport__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { buildClause } from "@/utils/buildClause"
import { useBuildTransaction } from "./useBuildTransaction"
import { getIsPersonQueryKey } from "@/api"

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
export const useRegisterUserAction = ({ address, appId, roundId, onSuccess }: Props): UseSendTransactionReturnValue => {
  const clauseBuilder = useCallback(() => {
    let clauses = roundId
      ? buildClause({
          contractInterface: VeBetterPassportInterface,
          to: VE_BETTER_PASSPORT_ADDRESS,
          method: "registerActionForRound",
          args: [address, appId, roundId],
          comment: `Register action for ${address} for app ${appId} in round ${roundId}`,
        })
      : buildClause({
          contractInterface: VeBetterPassportInterface,
          to: VE_BETTER_PASSPORT_ADDRESS,
          method: "registerAction",
          args: [address, appId],
          comment: `Register action for ${address} for app ${appId} in current round`,
        })

    return [clauses]
  }, [address, appId, roundId])

  const refetchQueryKeys = useMemo(() => [getIsPersonQueryKey(address)], [])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
