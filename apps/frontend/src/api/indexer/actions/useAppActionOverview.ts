import { indexerQueryClient } from "../api"
import { paths } from "../schema"

type AppActionOverviewQuery = paths["/api/v1/b3tr/actions/apps/{appId}/overview"]["get"]
export type AppActionOverviewQueryOptions = AppActionOverviewQuery["parameters"]["query"]
export type AppActionOverviewResponse = AppActionOverviewQuery["responses"]["200"]["content"]["*/*"]

/**
 * Hook to fetch app action overview data from the indexer
 * @param appId The app ID to fetch overview for
 * @param queryOptions Optional query parameters (roundId, date)
 * @param enabled Whether the query should be enabled
 * @returns Query result containing app overview data
 */
export const useAppActionOverview = (appId: string, queryOptions?: AppActionOverviewQueryOptions, enabled = true) => {
  return indexerQueryClient.useQuery(
    "get",
    "/api/v1/b3tr/actions/apps/{appId}/overview",
    {
      params: { query: queryOptions, path: { appId } },
    },
    { enabled: !!appId && !!enabled },
  )
}
