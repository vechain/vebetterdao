import { buildQueryString } from "@/api/utils"
import { getConfig } from "@repo/config"
import { useInfiniteQuery } from "@tanstack/react-query"

import { z } from "zod"
import { TotalImpactSchema } from "./schemas"

const indexerUrl = getConfig().indexerUrl

export const UserActionLeaderboardResponseSchema = z.object({
  pagination: z.object({
    hasNext: z.boolean(),
  }),
  data: z
    .array(
      z.object({
        wallet: z.string(),
        roundId: z.number(),
        actionsRewarded: z.number(),
        totalRewardAmount: z.number(),
        totalImpact: TotalImpactSchema.optional(),
      }),
    )
    .optional(),
})

export type UserActionLeaderboardResponse = z.infer<
  typeof UserActionLeaderboardResponseSchema
>

type UserActionLeaderboardRequest = {
  page: number
  size: number
  roundId?: string
  date?: string
  direction?: "asc" | "desc"
  sortBy?: "totalRewardAmount" | "actionsRewarded"
}

/**
 * Get the user action leaderboard with the given request data
 * @param data  the request data @see UserActionLeaderboardRequest
 * @returns the response data @see UserActionLeaderboardResponse
 */
export const getUserActionLeaderboard = async (
  data: UserActionLeaderboardRequest,
): Promise<UserActionLeaderboardResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")

  const queryString = buildQueryString(data)

  const response = await fetch(`${indexerUrl}/b3tr/actions/leaderboards/users?${queryString}`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch user action leaderboard: ${response.statusText}`)
  }

  return UserActionLeaderboardResponseSchema.parse(await response.json())
}

export const getUserActionLeaderboardQueryKey = (
  data: Omit<UserActionLeaderboardRequest, "page" | "size">,
) => ["USER_ACTION_LEADERBOARD", data.roundId, data.date, data.direction]

/**
 * Get the user action leaderboard with the given request data
 * @param roundId optional round ID to filter by
 * @param date optional date to filter by
 * @param direction sort direction, defaults to "asc"
 * @returns the query object with the data @see UserActionLeaderboardResponse
 */
export const useUserActionLeaderboard = ({
  roundId,
  date,
  direction = "asc",
}: Omit<UserActionLeaderboardRequest, "page" | "size">) => {
  return useInfiniteQuery({
    queryKey: getUserActionLeaderboardQueryKey({
      roundId,
      date,
      direction,
    }),
    queryFn: ({ pageParam = 0 }) =>
      getUserActionLeaderboard({ page: pageParam, size: 10, roundId, date, direction }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.pagination.hasNext ? lastPageParam + 1 : undefined,
  })
}
