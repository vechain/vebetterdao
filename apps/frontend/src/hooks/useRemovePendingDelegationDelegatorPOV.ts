import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useBuildTransaction } from "./useBuildTransaction"
import { buildClause } from "@/utils/buildClause"
import { getConfig } from "@repo/config"
import { isValid } from "@repo/utils/AddressUtils"
import { VeBetterPassport__factory } from "@repo/contracts"
import { getPendingDelegationsQueryKeyDelegatorPOV, getPendingDelegationsQueryKeyDelegateePOV } from "@/api"

const PassportContractInterface = VeBetterPassport__factory.createInterface()
const passportContractAddress = getConfig().veBetterPassportContractAddress
const method = "cancelOutgoingPendingDelegation"

type UseRemovePendingDelegationProps = {
  onSuccess?: () => void
}

type ClausesParams = {
  delegatee: string
}

/**
 * Provides a React hook to remove pending a delegation using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 */
export const useRemovePendingDelegationDelegatorPOV = ({ onSuccess }: UseRemovePendingDelegationProps) => {
  const { account } = useWallet()

  const clauseBuilder = useCallback(
    ({ delegatee }: ClausesParams) => {
      if (!account) throw new Error("Account is required")
      if (!isValid(delegatee)) throw new Error("Invalid delegatee address")

      return [
        buildClause({
          to: passportContractAddress,
          contractInterface: PassportContractInterface,
          method,
          args: [],
          comment: "remove pending delegation",
        }),
      ]
    },
    [account],
  )

  const refetchQueryKeys = useMemo(
    () => [
      getPendingDelegationsQueryKeyDelegatorPOV(account || ""),
      getPendingDelegationsQueryKeyDelegateePOV(account || ""),
    ],
    [account],
  )

  return useBuildTransaction<ClausesParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
