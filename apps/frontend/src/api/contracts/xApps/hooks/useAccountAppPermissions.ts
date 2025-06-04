import { useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory as X2EarnApps } from "@repo/contracts/typechain-types"
import { getXAppsQueryKey } from "./useXApps"
import { getXApps } from "../getXApps"

const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress

export const getAccountAppPermissionsQueryKey = (address?: string) => ["ACCOUNT_APP_PERMISSIONS", address]
type AccountAppPermissions = Record<
  string,
  {
    isAdmin: boolean
    isModerator: boolean
  }
>

export const useAccountAppPermissions = (address?: string): UseQueryResult<AccountAppPermissions> => {
  const thor = useThor()
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
      const contract = thor.contracts.load(X2EARNAPPS_CONTRACT, X2EarnApps.abi)

      // Use Promise.all to handle all permissions checks
      const permissions: AccountAppPermissions = {}

      for (const app of allApps) {
        const [isAdminRes, isModeratorRes] = await Promise.all([
          contract.read.isAppAdmin(app.id, address),
          contract.read.isAppModerator(app.id, address),
        ])

        if (!isAdminRes) throw new Error(`Failed to check admin status for ${app.id}`)
        if (!isModeratorRes) throw new Error(`Failed to check moderator status for ${app.id}`)

        permissions[app.id] = {
          isAdmin: Boolean(isAdminRes[0]),
          isModerator: Boolean(isModeratorRes[0]),
        }
      }

      return permissions
    },
  })
}
