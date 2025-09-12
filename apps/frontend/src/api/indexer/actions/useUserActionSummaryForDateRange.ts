import { buildQueryString } from "@/api/utils"
import { getConfig } from "@repo/config"
import { useInfiniteQuery } from "@tanstack/react-query"
import { z } from "zod"
import { TotalImpactSchema } from "./schemas"

const indexerUrl = getConfig().indexerUrl

export const UserActionSummaryForDateRangeObjectSchema = z.object({
  entity: z.string(),
  date: z.string(),
  actionsRewarded: z.number(),
  totalRewardAmount: z.number(),
  uniqueAppsUsed: z.array(z.string()).optional(),
  totalImpact: TotalImpactSchema.optional(),
})

export const UserActionSummaryForDateRangeSchema = z.object({
  pagination: z.object({
    hasNext: z.boolean(),
  }),
  data: z.array(UserActionSummaryForDateRangeObjectSchema).default([]),
})

export type UserActionSummaryForDateRangeResponse = z.infer<typeof UserActionSummaryForDateRangeSchema>

type UserActionSummaryForDateRangeRequest = {
  wallet: string
  startDate?: string
  endDate?: string
  page?: number
  size?: number
  direction?: "asc" | "desc"
}

/**
 * Get the user action summary by day for a single user in a specific date range
 * @param data  the request data @see UserActionSummaryForDateRangeRequest
 * @returns the response data @see UserActionSummaryForDateRangeResponse
 */
export const getUserActionSummaryForDateRange = async (
  data: UserActionSummaryForDateRangeRequest,
): Promise<UserActionSummaryForDateRangeResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")

  const queryString = buildQueryString(data)

  const response = await fetch(`${indexerUrl}/b3tr/actions/users/${data.wallet}/daily-summaries?${queryString}`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch user action summary: ${response.statusText}`)
  }

  return UserActionSummaryForDateRangeSchema.parse(await response.json())
}

export const getUserActionSummaryForDateRangeQueryKey = (
  data: Omit<UserActionSummaryForDateRangeRequest, "page" | "size">,
) => ["USER_ACTION_SUMMARY", "DATE_RANGE", data.wallet, data.startDate, data.endDate, data.direction]

/**
 * Get the user action summaries by day for a single user in a specific date range
 * @param data the request data @see UserActionSummaryForDateRangeRequest
 * @returns the query object with the data @see UserActionSummaryForDateRangeResponse
 */
export const useUserActionSummaryForDateRange = ({
  direction = "asc",
  ...data
}: Omit<UserActionSummaryForDateRangeRequest, "page" | "size">) => {
  return useInfiniteQuery({
    queryKey: getUserActionSummaryForDateRangeQueryKey({ direction, ...data }),
    queryFn: ({ pageParam = 0 }) =>
      getUserActionSummaryForDateRange({ page: pageParam, size: 100, direction, ...data }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.pagination.hasNext ? lastPageParam + 1 : undefined,
  })
}
