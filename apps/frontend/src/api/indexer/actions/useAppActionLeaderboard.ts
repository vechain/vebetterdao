import { buildQueryString } from "@/api/utils"
import { getConfig } from "@repo/config"
import { useInfiniteQuery } from "@tanstack/react-query"
import { z } from "zod"
import { TotalImpactSchema } from "../sustainability/schemas"

const indexerUrl = getConfig().indexerUrl

type AppActionLeaderboardRequest = {
  roundId?: number
  page?: number
  size?: number
  direction: "asc" | "desc"
  sortBy?: string
}

export const AppActionLeaderboardObjectSchema = z.object({
  appId: z.string(),
  roundId: z.number().optional(), // Optional for backward compatibility
  actionsRewarded: z.number(),
  totalRewardAmount: z.number(),
  totalImpact: TotalImpactSchema.optional(),
})

export const AppActionLeaderboardResponseSchema = z.object({
  pagination: z.object({
    hasNext: z.boolean(),
  }),
  data: z.array(AppActionLeaderboardObjectSchema).optional(),
})

export type AppActionLeaderboardResponse = z.infer<typeof AppActionLeaderboardResponseSchema>

/**
 * Get the app action leaderboard with the given request data
 * @param data  the request data @see AppActionLeaderboardRequest
 * @returns the response data @see AppActionLeaderboardResponse
 */
export const getAppActionLeaderboard = async (
  data: AppActionLeaderboardRequest,
): Promise<AppActionLeaderboardResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")

  const queryString = buildQueryString(data)

  const response = await fetch(`${indexerUrl}/b3tr/actions/leaderboards/apps?${queryString}`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch app action leaderboard: ${response.statusText}`)
  }

  return AppActionLeaderboardResponseSchema.parse(await response.json())
}

export const getAppActionLeaderboardQueryKey = (data: Omit<AppActionLeaderboardRequest, "page" | "size">) => [
  "APP_ACTION_LEADERBOARD",
  data.roundId,
  data.direction,
  data.sortBy,
]

/**
 * Hook to get the app action leaderboard with the given request data
 * @param data the request data @see AppActionLeaderboardRequest
 * @returns the query object with the data @see AppActionLeaderboardResponse
 */
export const useAppActionLeaderboard = (data: Omit<AppActionLeaderboardRequest, "page" | "size">) => {
  return useInfiniteQuery({
    queryKey: getAppActionLeaderboardQueryKey(data),
    queryFn: ({ pageParam = 0 }) => getAppActionLeaderboard({ ...data, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.pagination.hasNext ? lastPageParam + 1 : undefined,
  })
}

// Backward compatibility aliases for the round-specific hook
export type AppActionRoundLeaderboardRequest = Omit<AppActionLeaderboardRequest, "sortBy">
export type AppActionRoundLeaderboardResponse = AppActionLeaderboardResponse
export const AppActionRoundLeaderboardResponseSchema = AppActionLeaderboardResponseSchema

/**
 * Get the app action leaderboard by round query key (backward compatibility)
 * @param data the request data
 * @returns the query key
 */
export const getAppActionRoundLeaderboardQueryKey = (data: Omit<AppActionRoundLeaderboardRequest, "page" | "size">) =>
  getAppActionLeaderboardQueryKey(data)

/**
 * Get the app action leaderboard by round (backward compatibility)
 * @param data the request data
 * @returns the response data
 */
export const getAppActionRoundLeaderboard = getAppActionLeaderboard

/**
 * Hook to get the app action leaderboard by round (backward compatibility)
 * @param data the request data @see AppActionRoundLeaderboardRequest
 * @returns the query object with the data @see AppActionRoundLeaderboardResponse
 */
export const useAppActionRoundLeaderboard = (data: Omit<AppActionRoundLeaderboardRequest, "page" | "size">) => {
  return useAppActionLeaderboard(data)
}
