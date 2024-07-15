import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { useQueries, useQueryClient } from "@tanstack/react-query"
import { getIsAppAdmin, getIsAppAdminQueryKey } from "./useIsAppAdmin"
import { getIsAppModerator, getIsAppModeratorQueryKey } from "./useIsAppModerator"

export const getAppAdministrationRoleQueryKey = (appId: string, address: string) => [
  "getAppAdministrationRole",
  appId,
  address,
]

export type AppAdministrationRole = {
  isAdmin: boolean
  isModerator: boolean
  appId: string
}

export const useGetAppAdministrationRole = (appIds: string[]) => {
  const { thor } = useConnex()
  const queryClient = useQueryClient()
  const { account } = useWallet()

  // for each app check if user is admin or moderator
  return useQueries({
    queries: appIds.map(id => ({
      queryKey: getAppAdministrationRoleQueryKey(id, account ?? ""),
      queryFn: async (): Promise<AppAdministrationRole> => {
        const isAppAdmin = await queryClient.ensureQueryData({
          queryKey: getIsAppAdminQueryKey(id, account ?? ""),
          queryFn: () => getIsAppAdmin(thor, id, account ?? ""),
        })

        const isAppModerator = await queryClient.ensureQueryData({
          queryKey: getIsAppModeratorQueryKey(id, account ?? ""),
          queryFn: () => getIsAppModerator(thor, id, account ?? ""),
        })

        return {
          isAdmin: isAppAdmin,
          isModerator: isAppModerator,
          appId: id,
        }
      },
    })),
  })
}
