import { getConfig } from "@repo/config"
import { useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"

import { getXApps } from "../getXApps"

import { getXAppsQueryKey } from "./useXApps"

const abi = X2EarnApps__factory.abi
const contractAddress = getConfig().x2EarnAppsContractAddress as `0x${string}`
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
      const { allApps } = await queryClient.ensureQueryData({
        queryKey: getXAppsQueryKey(),
        queryFn: async () => await getXApps(thor),
      })
      const res = await executeMultipleClausesCall({
        thor,
        calls: allApps.flatMap(app => [
          {
            abi,
            address: contractAddress,
            functionName: "isAppAdmin",
            args: [app.id, address],
          } as const,
          {
            abi,
            address: contractAddress,
            functionName: "isAppModerator",
            args: [app.id, address],
          } as const,
        ]),
      })

      const permissions: AccountAppPermissions = {}
      let appIndex = 0
      for (let i = 0; i < res.length; i += 2) {
        const appId = allApps[appIndex]?.id
        if (appId) {
          permissions[appId] = {
            isAdmin: res[i] || false,
            isModerator: res[i + 1] || false,
          }
        }

        appIndex++
      }

      return permissions
    },
  })
}
