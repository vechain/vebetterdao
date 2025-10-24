import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"

import { getXApps } from "../getXApps"

/**
 * Query key for the xApps query
 * @param filterBlacklisted - whether to filter blacklisted xApps
 * @returns the query key
 */
export const getXAppsQueryKey = (filterBlacklisted: boolean = false) => [
  "getXApps",
  filterBlacklisted ? "includes-blacklisted" : "excludes-blacklisted",
]
/**
 * Hook to get all the available xApps in the B3TR ecosystem
 * @param filterBlacklisted - whether to filter blacklisted xApps
 * @returns all the available xApps in the B3TR ecosystem capped to 256
 */
export const useXApps = ({ filterBlacklisted = false } = {}) => {
  const thor = useThor()
  return useQuery({
    queryKey: getXAppsQueryKey(filterBlacklisted),
    queryFn: async () => await getXApps(thor, filterBlacklisted),
    enabled: !!thor,
  })
}
