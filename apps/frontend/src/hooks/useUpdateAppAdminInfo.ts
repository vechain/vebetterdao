import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/factories/ve-better-passport/VeBetterPassport__factory"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/X2EarnApps__factory"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { getAppAdminQueryKey } from "../api/contracts/xApps/hooks/useAppAdmin"
import { getAppCreatorsQueryKey } from "../api/contracts/xApps/hooks/useAppCreators"
import { getAppModeratorsQueryKey } from "../api/contracts/xApps/hooks/useAppModerators"
import { getAppRewardDistributorsQueryKey } from "../api/contracts/xApps/hooks/useAppRewardDistributors"
import { getXAppsQueryKey } from "../api/contracts/xApps/hooks/useXApps"

import { useBuildTransaction } from "./useBuildTransaction"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()
const VeBetterPassportInterface = VeBetterPassport__factory.createInterface()
type Props = { appId: string; onSuccess?: () => void }
type ClausesProps = {
  appId: string
  adminAddress?: string
  teamWalletAddress?: string
  moderatorsToBeAdded?: string[]
  moderatorsToBeRemoved?: string[]
  distributorsToBeAdded?: string[]
  distributorsToBeRemoved?: string[]
  creatorsToBeAdded?: string[]
  creatorsToBeRemoved?: string[]
  signalersToBeAdded?: string[]
  signalersToBeRemoved?: string[]
}
/**
 * Custom hook to update the app admin info.
 * @returns An object containing the transaction state and the function to update the app admin info.
 * @param appId The app ID.
 */
export const useUpdateAppAdminInfo = ({ appId, onSuccess }: Props) => {
  const clauseBuilder = useCallback(
    ({
      appId,
      adminAddress,
      teamWalletAddress,
      moderatorsToBeAdded,
      moderatorsToBeRemoved,
      distributorsToBeAdded,
      distributorsToBeRemoved,
      creatorsToBeAdded,
      creatorsToBeRemoved,
      signalersToBeAdded,
      signalersToBeRemoved,
    }: ClausesProps) => {
      const clauses = []

      if (creatorsToBeRemoved?.length) {
        creatorsToBeRemoved.forEach(creator => {
          clauses.push(
            buildClause({
              to: getConfig().x2EarnAppsContractAddress,
              contractInterface: X2EarnAppsInterface,
              method: "removeAppCreator",
              args: [appId, creator],
              comment: "remove creator",
            }),
          )
        })
      }

      if (creatorsToBeAdded?.length) {
        creatorsToBeAdded.forEach(creator => {
          clauses.push(
            buildClause({
              to: getConfig().x2EarnAppsContractAddress,
              contractInterface: X2EarnAppsInterface,
              method: "addCreator",
              args: [appId, creator],
              comment: "add creator",
            }),
          )
        })
      }

      if (moderatorsToBeRemoved?.length) {
        moderatorsToBeRemoved.forEach(moderator => {
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

      if (signalersToBeAdded?.length) {
        signalersToBeAdded.forEach(signaler => {
          clauses.push(
            buildClause({
              to: getConfig().veBetterPassportContractAddress,
              contractInterface: VeBetterPassportInterface,
              method: "assignSignalerToAppByAppAdmin",
              args: [appId, signaler],
              comment: "add signaler to app by app admin",
            }),
          )
        })
      }

      if (signalersToBeRemoved?.length) {
        signalersToBeRemoved.forEach(signaler => {
          clauses.push(
            buildClause({
              to: getConfig().veBetterPassportContractAddress,
              contractInterface: VeBetterPassportInterface,
              method: "removeSignalerFromAppByAppAdmin",
              args: [signaler],
              comment: "remove signaler from app by app admin",
            }),
          )
        })
      }

      if (moderatorsToBeAdded?.length) {
        moderatorsToBeAdded.forEach(moderator => {
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

      if (distributorsToBeRemoved?.length) {
        distributorsToBeRemoved.forEach(distributor => {
          clauses.push(
            buildClause({
              to: getConfig().x2EarnAppsContractAddress,
              contractInterface: X2EarnAppsInterface,
              method: "removeRewardDistributor",
              args: [appId, distributor],
              comment: "remove reward distributor",
            }),
          )
        })
      }

      if (distributorsToBeAdded?.length) {
        distributorsToBeAdded.forEach(distributor => {
          clauses.push(
            buildClause({
              to: getConfig().x2EarnAppsContractAddress,
              contractInterface: X2EarnAppsInterface,
              method: "addRewardDistributor",
              args: [appId, distributor],
              comment: "add reward distributor",
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
    () => [
      getAppAdminQueryKey(appId),
      getAppModeratorsQueryKey(appId),
      getAppCreatorsQueryKey(appId),
      getXAppsQueryKey(),
      getAppRewardDistributorsQueryKey(appId),
    ],
    [appId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
