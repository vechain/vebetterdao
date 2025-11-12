import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/X2EarnApps__factory"
import { EnhancedClause } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getXAppsQueryKey } from "../../api/contracts/xApps/hooks/useXApps"
import { useBuildTransaction } from "../useBuildTransaction"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()
type useSubmitAppProps = {
  onSuccess?: () => Promise<void> | void
  onSuccessMessageTitle?: string
}
type BuildClausesProps = {
  teamWalletAddress: string
  adminAddress: string
  appName: string
  appMetadataUri: string
}
/**
 * Custom hook for submitting new applications to the X2EarnApps smart contract
 *
 * @param {useSubmitAppProps} props - Configuration options for the hook
 * @returns {useSubmitAppReturnValue} Object containing transaction functions and status
 *
 * @example
 * const { sendTransaction, status, error } = useSubmitNewApp({
 *   onSuccess: () => console.log("Success"),
 * });
 *
 * await sendTransaction({
 *   teamWalletAddress: "0x...",
 *   adminAddress: "0x...",
 *   appName: "My App",
 *   appMetadataUri: "ipfs://..."
 * });
 */
export const useSubmitNewApp = ({ onSuccess }: useSubmitAppProps) => {
  const buildClauses = useCallback((data: BuildClausesProps) => {
    const clauses: EnhancedClause[] = [
      {
        to: getConfig().x2EarnAppsContractAddress,
        value: 0,
        data: X2EarnAppsInterface.encodeFunctionData("submitApp", [
          data.teamWalletAddress,
          data.adminAddress,
          data.appName,
          data.appMetadataUri,
        ]),
        comment: "Submit new app",
        abi: JSON.parse(JSON.stringify(X2EarnAppsInterface.getFunction("submitApp"))),
      },
    ]

    return clauses
  }, [])

  const refetchQueryKeys = useMemo(() => [getXAppsQueryKey()], [])

  return useBuildTransaction({
    clauseBuilder: buildClauses,
    onSuccess,
    refetchQueryKeys,
  })
}
