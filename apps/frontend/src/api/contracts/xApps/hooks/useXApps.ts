import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getXApps } from "../getXApps"

export const getXAppsQueryKey = (filterBlacklisted: boolean = false) => [
  "getXApps",
  filterBlacklisted ? "includes-blacklisted" : "excludes-blacklisted",
]

/**
 *  Hook to get all the available xApps in the B3TR ecosystem
 * @returns all the available xApps in the B3TR ecosystem capped to 256
 */
export const useXApps = (filterBlacklisted = false) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getXAppsQueryKey(filterBlacklisted),
    queryFn: async () => await getXApps(thor, filterBlacklisted),
    enabled: !!thor,
  })
}
