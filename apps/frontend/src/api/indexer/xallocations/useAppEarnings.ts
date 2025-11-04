import { indexerQueryClient } from "../api"
import { paths } from "../schema"

type AppEarningsQuery = paths["/api/v1/b3tr/xallocations/earnings"]["get"]
export type AppEarningsQueryOptions = AppEarningsQuery["parameters"]["query"]
type AppEarningsQueryResponse = AppEarningsQuery["responses"]["200"]["content"]["*/*"]

/**
 * Hook to fetch total earnings for a single app across all rounds (or a specific round if provided).
 * @param appId The app ID to fetch earnings for
 * @param queryOptions Optional query parameters (e.g., roundId to filter by specific round)
 * @returns Query result with earnings data
 */
export const useAppEarnings = (appId: string, queryOptions?: Omit<AppEarningsQueryOptions, "appId">) => {
  return indexerQueryClient.useQuery("get", "/api/v1/b3tr/xallocations/earnings", {
    params: { query: { appId, ...queryOptions } },
    enabled: !!appId,
  })
}

export type AppEarnings = AppEarningsQueryResponse
