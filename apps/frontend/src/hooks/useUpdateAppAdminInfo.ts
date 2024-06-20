import { useCallback, useMemo } from "react"
import { X2EarnApps__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { buildClause } from "@/utils/buildClause"
import { useBuildTransaction } from "./useBuildTransaction"
import { getAppAdminQueryKey, getAppModeratorsQueryKey, getXAppsQueryKey } from "@/api"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()

type Props = { appId: string; onSuccess?: () => void }

type ClausesProps = {
  appId: string
  adminAddress?: string
  teamWalletAddress?: string
  moderatorsToBeAdded?: string[]
  moderatorsToBeRemoved?: string[]
}

/**
 * Custom hook to update the app admin info.
 * @returns An object containing the transaction state and the function to update the app admin info.
 * @param appId The app ID.
 */

export const useUpdateAppAdminInfo = ({ appId, onSuccess }: Props) => {
  const clauseBuilder = useCallback(
    ({ appId, adminAddress, teamWalletAddress, moderatorsToBeAdded, moderatorsToBeRemoved }: ClausesProps) => {
      const clauses = []

      if (moderatorsToBeAdded?.length) {
        moderatorsToBeAdded.map(moderator => {
          clauses.push(
            buildClause({
              to: getConfig().x2EarnAppsContractAddress,
              contractInterface: X2EarnAppsInterface,
              method: "addAppModerator",
              args: [appId, moderator],
              comment: "add moderator",
            }),
          )
        })
      }

      if (moderatorsToBeRemoved?.length) {
        moderatorsToBeRemoved.map(moderator => {
          clauses.push(
            buildClause({
              to: getConfig().x2EarnAppsContractAddress,
              contractInterface: X2EarnAppsInterface,
              method: "removeAppModerator",
              args: [appId, moderator],
              comment: "remove moderator",
            }),
          )
        })
      }

      if (teamWalletAddress) {
        clauses.push(
          buildClause({
            to: getConfig().x2EarnAppsContractAddress,
            contractInterface: X2EarnAppsInterface,
            method: "updateTeamWalletAddress",
            args: [appId, teamWalletAddress],
            comment: "update app admin",
          }),
        )
      }

      if (adminAddress) {
        clauses.push(
          buildClause({
            to: getConfig().x2EarnAppsContractAddress,
            contractInterface: X2EarnAppsInterface,
            method: "setAppAdmin",
            args: [appId, adminAddress],
            comment: "update app admin",
          }),
        )
      }

      return clauses
    },
    [],
  )

  const refetchQueryKeys = useMemo(
    () => [getAppAdminQueryKey(appId), getAppModeratorsQueryKey(appId), getXAppsQueryKey()],
    [appId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
