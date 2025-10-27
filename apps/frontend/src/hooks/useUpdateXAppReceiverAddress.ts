import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/X2EarnApps__factory"
import { EnhancedClause, UseSendTransactionReturnValue } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { getXAppsQueryKey } from "../api/contracts/xApps/hooks/useXApps"

import { useBuildTransaction } from "./useBuildTransaction"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()
type Props = {
  appId: string
  newAddress: string
  onSuccess?: () => void
  onSuccessMessageTitle?: string
}
/**
 * Admin can update the team wallet address for a specific xApp
 *
 * @param onSuccess callback to run when the upgrade is successful
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useUpdateXAppReceiverAddress = ({
  appId,
  newAddress,
  onSuccess,
}: Props): UseSendTransactionReturnValue => {
  const clauseBuilder = useCallback(() => {
    const clauses: EnhancedClause[] = [
      buildClause({
        to: getConfig().x2EarnAppsContractAddress,
        contractInterface: X2EarnAppsInterface,
        method: "updateTeamWalletAddress",
        args: [appId, newAddress],
        comment: `Update xApp team wallet address to ${newAddress}`,
      }),
    ]
    return clauses
  }, [appId, newAddress])
  const refetchQueryKeys = useMemo(() => [getXAppsQueryKey()], [])
  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
