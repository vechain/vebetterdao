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
      pageParamName: "page",
      initialPageParam: 0,
      getNextPageParam: (
        lastPage: UserActionLeaderboardQueryResponse,
        _allPages: UserActionLeaderboardQueryResponse[],
        lastPageParam: number,
      ) => {
        return lastPage.pagination.hasNext ? lastPageParam + 1 : undefined
      },
    },
  )
}
