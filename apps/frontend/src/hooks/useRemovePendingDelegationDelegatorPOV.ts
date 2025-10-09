import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getPendingDelegationsQueryKeyDelegatorPOV } from "../api/contracts/vePassport/hooks/useGetPendingDelegationsDelegatorPOV"
import { getPendingDelegationsQueryKeyDelegateePOV } from "../api/contracts/vePassport/hooks/useGetPendingDelegationsDelegateePOV"

import { useBuildTransaction } from "./useBuildTransaction"

import { buildClause } from "@/utils/buildClause"

const PassportContractInterface = VeBetterPassport__factory.createInterface()
const passportContractAddress = getConfig().veBetterPassportContractAddress
const method = "cancelOutgoingPendingDelegation"
type UseRemovePendingDelegationProps = {
  onSuccess?: () => void
}
/**
 * Provides a React hook to remove pending a delegation using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 */
export const useRemovePendingDelegationDelegatorPOV = ({ onSuccess }: UseRemovePendingDelegationProps) => {
  const { account } = useWallet()
  const clauseBuilder = useCallback(() => {
    if (!account?.address) throw new Error("Account is required")
    // if (!isValid(delegatee)) throw new Error("Invalid delegatee address")
    return [
      buildClause({
        to: passportContractAddress,
        contractInterface: PassportContractInterface,
        method,
        args: [],
        comment: "remove pending delegation",
      }),
    ]
  }, [account?.address])
  const refetchQueryKeys = useMemo(
    () => [
      getPendingDelegationsQueryKeyDelegatorPOV(account?.address || ""),
      getPendingDelegationsQueryKeyDelegateePOV(account?.address || ""),
    ],
    [account?.address],
  )
  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
