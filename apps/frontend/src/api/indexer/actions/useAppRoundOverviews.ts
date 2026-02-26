import { useQueries } from "@tanstack/react-query"

import { fetchClient } from "../api"

const MAX_ROUNDS = 24

/**
 * Bulk-fetches app action overview data for multiple rounds in parallel.
 * Uses round IDs to determine which rounds to fetch, capped to the most recent MAX_ROUNDS.
 * @param appId The app ID
 * @param roundIds Array of round IDs to query (typically from earnings data)
 */
export const useAppRoundOverviews = (appId: string, roundIds: number[]) => {
  const recentRoundIds = roundIds.slice(-MAX_ROUNDS)

  return useQueries({
    queries: recentRoundIds.map(roundId => ({
      queryKey: ["app-overview", appId, roundId],
      queryFn: async () => {
        const result = await fetchClient.GET("/api/v1/b3tr/actions/apps/{appId}/overview", {
          params: { path: { appId }, query: { roundId } },
        })
        return { roundId, ...result.data }
      },
      enabled: !!appId && !!roundId,
      staleTime: 5 * 60 * 1000,
    })),
    combine: results => ({
      data: results.every(r => r.isSuccess)
        ? results
            .map(r => r.data!)
            .filter(Boolean)
            .sort((a, b) => a.roundId - b.roundId)
        : undefined,
      isLoading: results.some(r => r.isLoading),
    }),
  })
}
