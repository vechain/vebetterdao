import { indexerQueryClient } from "../api"
import { paths } from "../schema"

type UserActionLeaderboardQuery = paths["/api/v1/b3tr/actions/leaderboards/users"]["get"]
type UserActionLeaderboardQueryOptions = UserActionLeaderboardQuery["parameters"]["query"]
type UserActionLeaderboardQueryResponse = UserActionLeaderboardQuery["responses"]["200"]["content"]["*/*"]
export const useUserActionLeaderboard = (queryOptions: UserActionLeaderboardQueryOptions) => {
  return indexerQueryClient.useInfiniteQuery(
    "get",
    "/api/v1/b3tr/actions/leaderboards/users",
    {
      params: { query: queryOptions },
    },
    {
      pageParamName: "cursor",
      initialPageParam: undefined,
      getNextPageParam: (lastPage: UserActionLeaderboardQueryResponse) => {
        return lastPage.pagination.hasNext ? lastPage.pagination.cursor : undefined
      },
    },
  )
}
