import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts"
import { EnhancedClause, UseSendTransactionReturnValue } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getXAppsQueryKey } from "../api/contracts/xApps/hooks/useXApps"
import { getXAppMetadataQueryKey } from "../api/contracts/xApps/hooks/useXAppMetadata"

import { useBuildTransaction } from "./useBuildTransaction"

import { useCurrentAppInfo } from "@/app/apps/[appId]/hooks/useCurrentAppInfo"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()
type useUpdateAppDetailsProps = {
  appId: string
  onSuccess?: () => void
  onFailure?: () => void
}
type BuildClausesProps = {
  metadataUri: string
  teamWalletAddress?: string
}
export type useUpdateAppMetadataReturnValue = {
  sendTransaction: (data: BuildClausesProps) => Promise<void>
} & Omit<UseSendTransactionReturnValue, "sendTransaction">
/**
 *  Hook to update the metadata of an app
 * @param param0 appId, onSuccess, invalidateCache
 * @returns see {@link useUpdateAppMetadataReturnValue}
 */
export const useUpdateAppDetails = ({
  appId,
  onSuccess,
  onFailure,
}: useUpdateAppDetailsProps): useUpdateAppMetadataReturnValue => {
  const { app } = useCurrentAppInfo()
  const buildClauses = useCallback(
    ({ metadataUri }: BuildClausesProps) => {
      const clauses: EnhancedClause[] = [
        {
          to: getConfig().x2EarnAppsContractAddress,
          value: 0,
          data: X2EarnAppsInterface.encodeFunctionData("updateAppMetadata", [appId, metadataUri]),
          comment: "Update app metadata",
          abi: JSON.parse(JSON.stringify(X2EarnAppsInterface.getFunction("updateAppMetadata"))),
        },
      ]

      return clauses
    },
    [appId],
  )
  const refetchQueryKeys = useMemo(
    () => [getXAppsQueryKey(), getXAppMetadataQueryKey(app?.metadataURI)],
    [app?.metadataURI],
  )

  return useBuildTransaction({
    clauseBuilder: buildClauses,
    refetchQueryKeys,
    onSuccess,
    onFailure,
  })
}
