import { indexerQueryClient } from "../api"
import { paths } from "../schema"

type UserActionSummaryForDateRangeQuery = paths["/api/v1/b3tr/actions/users/{wallet}/daily-summaries"]["get"]

type UserActionSummaryForDateRangeQueryOptions = UserActionSummaryForDateRangeQuery["parameters"]["query"]

type UserActionSummaryForDateRangeQueryResponse =
  UserActionSummaryForDateRangeQuery["responses"]["200"]["content"]["*/*"]

export const useUserActionSummaryForDateRange = (
  wallet: string,
  queryOptions: UserActionSummaryForDateRangeQueryOptions,
) => {
  const { direction = "ASC" } = queryOptions
  return indexerQueryClient.useInfiniteQuery(
    "get",
    "/api/v1/b3tr/actions/users/{wallet}/daily-summaries",
    {
      params: { path: { wallet }, query: { ...queryOptions, direction }, enabled: !!wallet },
    },
    {
      initialPageParam: 0,
      getNextPageParam: (lastPage: UserActionSummaryForDateRangeQueryResponse) => lastPage.pagination.hasNext,
    },
  )
}
