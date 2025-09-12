import { buildQueryString } from "@/api/utils"
import { getConfig } from "@repo/config"
import { useInfiniteQuery } from "@tanstack/react-query"

import { z } from "zod"
import { TotalImpactSchema } from "./schemas"

const indexerUrl = getConfig().indexerUrl

export const SustainabilityMultipleUsersOverviewObjectSchema = z.object({
  entity: z.string(),
  actionsRewarded: z.number(),
  totalRewardAmount: z.number(),
  totalImpact: TotalImpactSchema.optional(),
})

export const SustainabilityUserOverviewResponseSchema = z.object({
  pagination: z.object({
    hasNext: z.boolean(),
  }),
  data: z.array(SustainabilityMultipleUsersOverviewObjectSchema).optional(),
})

export type SustainabilityUserOverviewResponse = z.infer<typeof SustainabilityUserOverviewResponseSchema>

type SustainabilityUserOverviewRequest = {
  page?: number
  size?: number
  direction?: "asc" | "desc"
  sortBy?: "totalRewardAmount" | "actionsRewarded" | "roundId"
}

/**
 * Get the sustainability overview for aall users with the given request data
 * @param data  the request data @see SustainabilityUserOverviewRequest
 * @returns the response data @see SustainabilityUserOverviewResponse
 */
export const getSustainabilityUserOverview = async (
  data: SustainabilityUserOverviewRequest,
): Promise<SustainabilityUserOverviewResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")

  const queryString = buildQueryString(data)

  const response = await fetch(`${indexerUrl}/b3tr/actions/leaderboards/users?${queryString}`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch sustainability user overview: ${response.statusText}`)
  }

  return SustainabilityUserOverviewResponseSchema.parse(await response.json())
}

export const getSustainabilityUserOverviewQueryKey = (
  data: Omit<SustainabilityUserOverviewRequest, "page" | "size">,
) => ["SUSTAINABILITY", "USER_OVERVIEW", "ALL_USERS", "ALL_ROUNDS", data.direction]

/**
 * Get the sustainability overview for all users for all rounds, with the given request data
 * @param data the request data @see SustainabilityUserOverviewRequest
 * @returns the query object with the data @see SustainabilityUserOverviewResponse
 */
export const useSustainabilityUserOverview = ({
  direction = "asc",
}: Omit<SustainabilityUserOverviewRequest, "page" | "size">) => {
  return useInfiniteQuery({
    queryKey: getSustainabilityUserOverviewQueryKey({
      direction,
    }),
    queryFn: ({ pageParam = 0 }) => getSustainabilityUserOverview({ page: pageParam, size: 100, direction }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.pagination.hasNext ? lastPageParam + 1 : undefined,
  })
}
