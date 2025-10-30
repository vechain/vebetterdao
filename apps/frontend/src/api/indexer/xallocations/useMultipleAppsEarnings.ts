import { useQueries } from "@tanstack/react-query"
import { useMemo } from "react"

import { fetchClient } from "../api"

/**
 * Hook to fetch earnings for multiple apps.
 * Returns raw earnings data per app without aggregation.
 * @param appIds Array of app IDs to fetch earnings for
 * @returns Object with earnings data per app and loading state
 */
export const useMultipleAppsEarnings = (appIds: string[]) => {
  const earningsQueries = useQueries({
    queries: appIds.map(appId => ({
      queryKey: ["xallocations", "earnings", appId],
      queryFn: async () => {
        const result = await fetchClient.GET("/api/v1/b3tr/xallocations/earnings", {
          params: { query: { appId } },
        })
        return {
          appId,
          earnings: result.data,
        }
      },
      enabled: !!appId,
    })),
  })

  const isLoading = earningsQueries.some(query => query.isLoading)

  const data = useMemo(() => {
    if (earningsQueries.some(query => !query.data)) {
      return undefined
    }

    return earningsQueries.map(query => query.data!).filter(Boolean)
  }, [earningsQueries])

  return { data, isLoading }
}
