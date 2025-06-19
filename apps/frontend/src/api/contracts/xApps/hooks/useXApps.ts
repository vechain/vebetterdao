import { useQuery } from "@tanstack/react-query"
import { getXApps, isNewApp } from "../getXApps"
import { useThor, useXApp as useXAppKit, useRoundXApps as useRoundXAppsKit } from "@vechain/vechain-kit"

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

export const useXApp = (appId: string) => {
  const { data: xApp, ...rest } = useXAppKit(appId)

  const isNew = isNewApp(xApp)

  return {
    ...rest,
    data: xApp
      ? {
          ...xApp,
          isNew,
        }
      : undefined,
  }
}

export const useRoundXApps = (roundId?: string) => {
  const { data: xApps = [], ...rest } = useRoundXAppsKit(roundId)

  return {
    ...rest,
    data: xApps.map(app => ({ ...app, isNew: isNewApp(app) })),
  }
}
