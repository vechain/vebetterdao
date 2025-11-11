import { indexerQueryClient } from "../api"
import { paths } from "../schema"

type UserActionLeaderboardQuery = paths["/api/v1/b3tr/actions/leaderboards/users"]["get"]
type UserActionLeaderboardQueryOptions = Omit<UserActionLeaderboardQuery["parameters"]["query"], "cursor">
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
      initialPageParam: "",
      getNextPageParam: (
        lastPage: UserActionLeaderboardQueryResponse,
        _allPages: UserActionLeaderboardQueryResponse[],
        _lastPageParam: unknown,
      ) => {
        return lastPage.pagination.hasNext && lastPage.pagination.cursor ? lastPage.pagination.cursor : undefined
      },
    },
  )
}
