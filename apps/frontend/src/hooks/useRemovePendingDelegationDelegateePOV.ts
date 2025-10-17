import { getConfig } from "@repo/config"
import { isValid } from "@repo/utils/AddressUtils"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/factories/ve-better-passport/VeBetterPassport__factory"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { getPendingDelegationsQueryKeyDelegateePOV } from "../api/contracts/vePassport/hooks/useGetPendingDelegationsDelegateePOV"
import { getPendingDelegationsQueryKeyDelegatorPOV } from "../api/contracts/vePassport/hooks/useGetPendingDelegationsDelegatorPOV"

import { useBuildTransaction } from "./useBuildTransaction"

const PassportContractInterface = VeBetterPassport__factory.createInterface()
const passportContractAddress = getConfig().veBetterPassportContractAddress
const method = "denyIncomingPendingDelegation"
type UseRemovePendingDelegationProps = {
  onSuccess?: () => void
}
type ClausesParams = {
  delegator: string
}
/**
 * Provides a React hook to remove pending a delegation using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 */
export const useRemovePendingDelegationDelegateePOV = ({ onSuccess }: UseRemovePendingDelegationProps) => {
  const { account } = useWallet()
  const clauseBuilder = useCallback(
    ({ delegator }: ClausesParams) => {
      if (!account?.address) throw new Error("Account is required")
      if (!isValid(delegator)) throw new Error("Invalid delegatee address")
      return [
        buildClause({
          to: passportContractAddress,
          contractInterface: PassportContractInterface,
          method,
          args: [delegator],
          comment: "remove pending delegation",
        }),
      ]
    },
    [account?.address],
  )
  const refetchQueryKeys = useMemo(
    () => [
      getPendingDelegationsQueryKeyDelegatorPOV(account?.address || ""),
      getPendingDelegationsQueryKeyDelegateePOV(account?.address || ""),
    ],
    [account?.address],
  )

  return useBuildTransaction<ClausesParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
