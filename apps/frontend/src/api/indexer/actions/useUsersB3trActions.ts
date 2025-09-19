import { indexerQueryClient } from "../api"
import { paths } from "../schema"

type UserB3trActionsQuery = paths["/api/v1/b3tr/actions/users/{wallet}"]["get"]

type UserB3trActionsQueryOptions = UserB3trActionsQuery["parameters"]["query"]

type UserB3trActionsQueryResponse = UserB3trActionsQuery["responses"]["200"]["content"]["*/*"]

export type UserB3trActions = UserB3trActionsQueryResponse["data"]

export const useUsersB3trActions = (wallet: string, queryOptions: UserB3trActionsQueryOptions) => {
  return indexerQueryClient.useInfiniteQuery(
    "get",
    "/api/v1/b3tr/actions/users/{wallet}",
    {
      params: { path: { wallet }, query: queryOptions },
    },
    {
      initialPageParam: 0,
      getNextPageParam: (lastPage: UserB3trActionsQueryResponse) => lastPage.pagination.hasNext,
    },
  )
}
