import { indexerQueryClient } from "../api"
import { paths } from "../schema"

type AppActionLeaderboardQuery = paths["/api/v1/b3tr/actions/leaderboards/apps"]["get"]

type AppActionLeaderboardQueryOptions = AppActionLeaderboardQuery["parameters"]["query"]

type AppActionLeaderboardQueryResponse = AppActionLeaderboardQuery["responses"]["200"]["content"]["*/*"]

export const useAppActionLeaderboard = (queryOptions: AppActionLeaderboardQueryOptions) => {
  return indexerQueryClient.useInfiniteQuery(
    "get",
    "/api/v1/b3tr/actions/leaderboards/apps",
    {
      params: { query: queryOptions },
    },
    {
      initialPageParam: 0,
      getNextPageParam: (lastPage: AppActionLeaderboardQueryResponse) => lastPage.pagination.hasNext,
    },
  )
}
