import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { useQueries, useQueryClient } from "@tanstack/react-query"
import { getIsAppAdmin, getIsAppAdminQueryKey } from "./useIsAppAdmin"
import { getIsAppModerator, getIsAppModeratorQueryKey } from "./useIsAppModerator"
import { useXApps } from "./useXApps"

export const getAppAdministrationRoleQueryKey = (appId: string, address: string) => [
  "getAppAdministrationRole",
  appId,
  address,
]

export const useGetAppAdministrationRole = (appIds: string[]) => {
  const { thor } = useConnex()
  const queryClient = useQueryClient()
  const { account } = useWallet()
  const { data: xApps } = useXApps()

  // for each app check if user is admin or moderator
  return useQueries({
    queries: appIds.map(app => ({
      queryKey: getAppAdministrationRoleQueryKey(app, account ?? ""),
      queryFn: async () => {
        const isAppAdmin = await queryClient.ensureQueryData({
          queryKey: getIsAppAdminQueryKey(app, account ?? ""),
          queryFn: () => getIsAppAdmin(thor, app, account ?? ""),
        })

        const isAppModerator = await queryClient.ensureQueryData({
          queryKey: getIsAppModeratorQueryKey(app, account ?? ""),
          queryFn: () => getIsAppModerator(thor, app, account ?? ""),
        })

        return {
          isAdmin: isAppAdmin,
          isModerator: isAppModerator,
          appId: app,
          app: xApps?.find(xApp => xApp.id === app),
        }
      },
    })),
  })

  // return true if user is admin or moderator for any app
}
