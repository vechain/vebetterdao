import { getConfig } from "@repo/config"
import { isValid } from "@repo/utils/AddressUtils"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getGetCumulativeScoreWithDecayQueryKey } from "../api/contracts/vePassport/hooks/useGetCumulativeScoreWithDecay"
import { getPendingDelegationsQueryKeyDelegateePOV } from "../api/contracts/vePassport/hooks/useGetPendingDelegationsDelegateePOV"
import { getPendingDelegationsQueryKeyDelegatorPOV } from "../api/contracts/vePassport/hooks/useGetPendingDelegationsDelegatorPOV"
import { useCurrentAllocationsRoundId } from "../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"

import { useBuildTransaction } from "./useBuildTransaction"

import { buildClause } from "@/utils/buildClause"
import { getDelegatorQueryKey } from "@/api/contracts/vePassport/hooks/useGetDelegator"

const PassportContractInterface = VeBetterPassport__factory.createInterface()
const passportContractAddress = getConfig().veBetterPassportContractAddress
const method = "acceptDelegation"
type UseAcceptDelegationProps = {
  onSuccess?: () => void
}
type ClausesParams = {
  delegator: string
}
/**
 * Provides a React hook to accept a delegation using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 */
export const useAcceptDelegation = ({ onSuccess }: UseAcceptDelegationProps) => {
  const { account } = useWallet()
  const { data: roundId } = useCurrentAllocationsRoundId()
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
          comment: "accept delegation",
        }),
      ]
    },
    [account?.address],
  )

  const refetchQueryKeys = useMemo(
    () => [
      getPendingDelegationsQueryKeyDelegatorPOV(account?.address || ""),
      getPendingDelegationsQueryKeyDelegateePOV(account?.address || ""),
      getDelegatorQueryKey(account?.address || ""),
      getGetCumulativeScoreWithDecayQueryKey(account?.address || "", Number(roundId)),
    ],
    [account?.address, roundId],
  )

  return useBuildTransaction<ClausesParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
