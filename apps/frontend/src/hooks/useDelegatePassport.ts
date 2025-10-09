import { getConfig } from "@repo/config"
import { isValid } from "@repo/utils/AddressUtils"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getPendingDelegationsQueryKeyDelegateePOV } from "@/api/contracts/vePassport/hooks/useGetPendingDelegationsDelegateePOV"
import { getPendingDelegationsQueryKeyDelegatorPOV } from "@/api/contracts/vePassport/hooks/useGetPendingDelegationsDelegatorPOV"
import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "./useBuildTransaction"

const PassportContractInterface = VeBetterPassport__factory.createInterface()
const passportContractAddress = getConfig().veBetterPassportContractAddress
const method = "delegatePassport"
type UseDelegatePassportProps = {
  onSuccess?: () => void
}
type ClausesParams = {
  delegatee: string
}
/**
 * Provides a React hook to propose a delegation using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 */
export const useDelegatePassport = ({ onSuccess }: UseDelegatePassportProps) => {
  const { account } = useWallet()
  const clauseBuilder = useCallback(
    ({ delegatee }: ClausesParams) => {
      if (!account?.address) throw new Error("Account is required")
      if (!isValid(delegatee)) throw new Error("Invalid delegatee address")
      return [
        buildClause({
          to: passportContractAddress,
          contractInterface: PassportContractInterface,
          method,
          args: [delegatee],
          comment: "propose delegation",
        }),
      ]
    },
    [account?.address],
  )
  const refetchQueryKeys = useMemo(
    () => [
      getPendingDelegationsQueryKeyDelegatorPOV(account?.address ?? ""),
      getPendingDelegationsQueryKeyDelegateePOV(account?.address ?? ""),
    ],
    [account?.address],
  )

  return useBuildTransaction<ClausesParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
