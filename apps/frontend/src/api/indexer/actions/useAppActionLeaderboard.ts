import { indexerQueryClient } from "../api"
import { paths } from "../schema"

// const indexerUrl = getConfig().indexerUrl

// type AppActionLeaderboardRequest = {
//   roundId?: number
//   page?: number
//   size?: number
//   direction: "asc" | "desc"
//   sortBy?: string
// }

// export const AppActionLeaderboardObjectSchema = z.object({
//   appId: z.string(),
//   roundId: z.number().optional(), // Optional for backward compatibility
//   actionsRewarded: z.number(),
//   totalRewardAmount: z.number(),
//   totalImpact: TotalImpactSchema.optional(),
// })

// export const AppActionLeaderboardResponseSchema = z.object({
//   pagination: z.object({
//     hasNext: z.boolean(),
//   }),
//   data: z.array(AppActionLeaderboardObjectSchema).optional(),
// })

// export type AppActionLeaderboardResponse = z.infer<typeof AppActionLeaderboardResponseSchema>

// /**
//  * Get the app action leaderboard with the given request data
//  * @param data  the request data @see AppActionLeaderboardRequest
//  * @returns the response data @see AppActionLeaderboardResponse
//  */
// export const getAppActionLeaderboard = async (
//   data: AppActionLeaderboardRequest,
// ): Promise<AppActionLeaderboardResponse> => {
//   if (!indexerUrl) throw new Error("Indexer URL not found")

//   const queryString = buildQueryString(data)

//   const response = await fetch(`${indexerUrl}/b3tr/actions/leaderboards/apps?${queryString}`, {
//     method: "GET",
//   })

//   if (!response.ok) {
//     throw new Error(`Failed to fetch app action leaderboard: ${response.statusText}`)
//   }

//   return AppActionLeaderboardResponseSchema.parse(await response.json())
// }

// export const getAppActionLeaderboardQueryKey = (data: Omit<AppActionLeaderboardRequest, "page" | "size">) => [
//   "APP_ACTION_LEADERBOARD",
//   data.roundId,
//   data.direction,
//   data.sortBy,
// ]

// /**
//  * Hook to get the app action leaderboard with the given request data
//  * @param data the request data @see AppActionLeaderboardRequest
//  * @returns the query object with the data @see AppActionLeaderboardResponse
//  */
// export const useAppActionLeaderboard = (data: Omit<AppActionLeaderboardRequest, "page" | "size">) => {
//   return useInfiniteQuery({
//     queryKey: getAppActionLeaderboardQueryKey(data),
//     queryFn: ({ pageParam = 0 }) => getAppActionLeaderboard({ ...data, page: pageParam }),
//     initialPageParam: 0,
//     getNextPageParam: (lastPage, _pages, lastPageParam) =>
//       lastPage.pagination.hasNext ? lastPageParam + 1 : undefined,
//   })
// }

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
