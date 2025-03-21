import { useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query"
import { useConnex } from "@vechain/vechain-kit"

import { getConfig } from "@repo/config"

import { X2EarnApps__factory as X2EarnApps } from "@repo/contracts"
import { abi } from "thor-devkit"
import { getXAppsQueryKey } from "./useXApps"
import { getXApps } from "../getXApps"

const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress

const isAdminFragment = X2EarnApps.createInterface().getFunction("isAppAdmin").format("json")
const isModeratorFragment = X2EarnApps.createInterface().getFunction("isAppModerator").format("json")
const isAdminAbi = new abi.Function(JSON.parse(isAdminFragment))
const isModeratorAbi = new abi.Function(JSON.parse(isModeratorFragment))

export const getAccountAppPermissionsQueryKey = (address?: string) => ["ACCOUNT_APP_PERMISSIONS", address]
type AccountAppPermissions = Record<
  string,
  {
    isAdmin: boolean
    isModerator: boolean
  }
>

export const useAccountAppPermissions = (address?: string): UseQueryResult<AccountAppPermissions> => {
  const { thor } = useConnex()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: getAccountAppPermissionsQueryKey(address ?? ""),
    enabled: !!address,
    queryFn: async () => {
      const appsQuery = await queryClient.ensureQueryData({
        queryKey: getXAppsQueryKey(),
        queryFn: async () => await getXApps(thor),
      })

      const allApps = appsQuery.allApps

      const clauses = allApps
        .map(app => [
          {
            to: X2EARNAPPS_CONTRACT,
            value: "0x0",
            data: isAdminAbi.encode(app.id, address),
          },
          {
            to: X2EARNAPPS_CONTRACT,
            value: "0x0",
            data: isModeratorAbi.encode(app.id, address),
          },
        ])
        .flat()

      const res = await thor.explain(clauses).execute()

      // Here we create an object where keys are app ids and values are the permissions for the given address
      // Every app should take two slots in the res array, the first one is the isAdmin result and the second one is the isModerator result

      const permissions: AccountAppPermissions = allApps.reduce((acc, app, index) => {
        const isAdminRes = res[index * 2] as Connex.VM.Output
        const isModeratorRes = res[index * 2 + 1] as Connex.VM.Output

        if (isAdminRes?.reverted) throw new Error(`Reverted: isAdmin for ${app.id} with ${isAdminRes?.revertReason}`)
        if (isModeratorRes?.reverted)
          throw new Error(`Reverted: isModerator for ${app.id} with ${isModeratorRes?.revertReason}`)

        const isAdminDecoded = isAdminAbi.decode(isAdminRes.data)
        const isModeratorDecoded = isModeratorAbi.decode(isModeratorRes.data)

        return {
          ...acc,
          [app.id]: {
            isAdmin: Boolean(isAdminDecoded[0]),
            isModerator: Boolean(isModeratorDecoded[0]),
          },
        }
      }, {} as AccountAppPermissions)

      return permissions
    },
  })
}
