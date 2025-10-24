"use client"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/X2EarnApps__factory"
import { EnhancedClause, UseSendTransactionReturnValue } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { XAppMetadata } from "@/api/contracts/xApps/getXAppMetadata"

import { getXAppsQueryKey } from "../api/contracts/xApps/hooks/useXApps"

import { AppWithoutCategories } from "./useAppsWithoutCategories"
import { useBuildTransaction } from "./useBuildTransaction"
import { useUploadAppMetadata } from "./useUploadAppMetadata"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()
export type AppCategoryAssignment = {
  app: AppWithoutCategories
  selectedCategories: string[]
}
type UseAdminAssignCategoriesProps = {
  onSuccess?: () => void
  onFailure?: () => void
}
export type UseAdminAssignCategoriesReturnValue = {
  assignCategories: (assignments: AppCategoryAssignment[]) => Promise<void>
  isUploading: boolean
  uploadError: Error | undefined
} & Omit<UseSendTransactionReturnValue, "sendTransaction">
/**
 * Hook for admin to assign categories to multiple apps in a single transaction
 * @param props onSuccess and onFailure callbacks
 * @returns assignCategories function and transaction state
 */
export const useAdminAssignCategories = ({
  onSuccess,
  onFailure,
}: UseAdminAssignCategoriesProps): UseAdminAssignCategoriesReturnValue => {
  const { onMetadataUpload, metadataUploading, metadataUploadError } = useUploadAppMetadata()
  const buildClauses = useCallback(
    (metadataUris: { appId: string; metadataUri: string; appName: string; categories: string[] }[]) => {
      const clauses: EnhancedClause[] = []
      // Create clauses for updating app metadata
      for (const { appId, metadataUri, appName, categories } of metadataUris) {
        clauses.push({
          to: getConfig().x2EarnAppsContractAddress,
          value: 0,
          data: X2EarnAppsInterface.encodeFunctionData("updateAppMetadata", [appId, metadataUri]),
          comment: `Assign categories ${categories.join(", ")} to ${appName}`,
          abi: JSON.parse(JSON.stringify(X2EarnAppsInterface.getFunction("updateAppMetadata"))),
        })
      }

      return clauses
    },
    [],
  )

  const refetchQueryKeys = useMemo(() => [getXAppsQueryKey()], [])

  const { sendTransaction, ...transactionState } = useBuildTransaction({
    clauseBuilder: buildClauses,
    refetchQueryKeys,
    onSuccess,
    onFailure,
  })

  const assignCategories = useCallback(
    async (assignments: AppCategoryAssignment[]) => {
      if (assignments.length === 0) {
        throw new Error("No assignments provided")
      }

      // Validate assignments
      for (const assignment of assignments) {
        if (assignment.selectedCategories.length === 0) {
          throw new Error(`No categories selected for app ${assignment.app.name}`)
        }
        if (assignment.selectedCategories.length > 2) {
          throw new Error(`Too many categories selected for app ${assignment.app.name}. Maximum is 2.`)
        }
      }

      // Upload metadata for each app and prepare metadata URIs
      const metadataUris = []
      for (const assignment of assignments) {
        const { app, selectedCategories } = assignment

        if (!app.metadata) {
          throw new Error(`Metadata not found for app ${app.name}`)
        }

        // Reconstruct complete metadata with new categories
        const updatedMetadata: XAppMetadata = {
          ...app.metadata,
          categories: selectedCategories,
        }

        // Upload metadata without image processing since images are already on IPFS
        const metadataUri = await onMetadataUpload(updatedMetadata, false)

        if (!metadataUri) {
          throw new Error(`Failed to upload metadata for app ${app.name}`)
        }

        metadataUris.push({
          appId: app.id,
          metadataUri,
          appName: app.name,
          categories: selectedCategories,
        })
      }

      await sendTransaction(metadataUris)
    },
    [sendTransaction, onMetadataUpload],
  )

  return {
    assignCategories,
    isUploading: metadataUploading,
    uploadError: metadataUploadError,
    ...transactionState,
  }
}
