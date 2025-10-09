import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getDelegatorQueryKey } from "../api/contracts/vePassport/hooks/useGetDelegator"
import { getDelegateeQueryKey } from "../api/contracts/vePassport/hooks/useGetDelegatee"

import { useBuildTransaction } from "./useBuildTransaction"

import { buildClause } from "@/utils/buildClause"

const PassportContractInterface = VeBetterPassport__factory.createInterface()
const passportContractAddress = getConfig().veBetterPassportContractAddress
const method = "revokeDelegation"
type UseRevokeDelegationProps = {
  onSuccess?: () => void
  isDelegator: boolean
}
/**
 * Provides a React hook to revoke a delegation using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 */
export const useRevokeDelegation = ({ onSuccess, isDelegator }: UseRevokeDelegationProps) => {
  const { account } = useWallet()
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: passportContractAddress,
        contractInterface: PassportContractInterface,
        method,
        args: [],
        comment: "revoke delegation",
      }),
    ]
  }, [])
  const refetchQueryKeys = useMemo(() => {
    if (isDelegator) {
      return [getDelegateeQueryKey(account?.address ?? "")]
    } else {
      return [getDelegatorQueryKey(account?.address ?? "")]
    }
  }, [isDelegator, account?.address])
  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
