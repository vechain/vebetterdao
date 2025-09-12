import { buildQueryString } from "@/api/utils"
import { getConfig } from "@repo/config"
import { useInfiniteQuery } from "@tanstack/react-query"
import { z } from "zod"
import { TotalImpactSchema } from "./schemas"

const indexerUrl = getConfig().indexerUrl

export const SustainabilitySingleUserOverviewByDayObjectSchema = z.object({
  entity: z.string(),
  date: z.string(),
  actionsRewarded: z.number(),
  totalRewardAmount: z.number(),
  uniqueAppsUsed: z.array(z.string()).optional(),
  totalImpact: TotalImpactSchema.optional(),
})

export const SustainabilitySingleUserOverviewByDaySchema = z.object({
  pagination: z.object({
    hasNext: z.boolean(),
  }),
  data: z.array(SustainabilitySingleUserOverviewByDayObjectSchema).default([]),
})

export type SustainabilitySingleUserOverviewByDayResponse = z.infer<typeof SustainabilitySingleUserOverviewByDaySchema>

type SustainabilityUserOverviewByDayRequest = {
  wallet: string
  startDate?: string
  endDate?: string
  page?: number
  size?: number
  direction?: "asc" | "desc"
}

/**
 * Get the sustainability overview by day for a single user in a specific date range
 * @param data  the request data @see SustainabilityUserOverviewByDayRequest
 * @returns the response data @see SustainabilitySingleUserOverviewByDayResponse
 */
export const getSustainabilitySingleUserOverviewByDay = async (
  data: SustainabilityUserOverviewByDayRequest,
): Promise<SustainabilitySingleUserOverviewByDayResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")

  const queryString = buildQueryString(data)

  const response = await fetch(`${indexerUrl}/b3tr/actions/users/${data.wallet}/daily-summaries?${queryString}`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch sustainability user overview: ${response.statusText}`)
  }

  return SustainabilitySingleUserOverviewByDaySchema.parse(await response.json())
}

export const getSustainabilitySingleUserOverviewByDayQueryKey = (
  data: Omit<SustainabilityUserOverviewByDayRequest, "page" | "size">,
) => ["SUSTAINABILITY", "USER_OVERVIEW_BY_DAY", data.wallet, data.startDate, data.endDate, data.direction]

/**
 * Get the sustainability overviews by day for a single in a specific date range
 * @param data the request data @see SustainabilityUserOverviewByDayRequest
 * @returns the query object with the data @see SustainabilitySingleUserOverviewByDayResponse
 */
export const useSustainabilitySingleUserOverviewByDay = ({
  direction = "asc",
  ...data
}: Omit<SustainabilityUserOverviewByDayRequest, "page" | "size">) => {
  return useInfiniteQuery({
    queryKey: getSustainabilitySingleUserOverviewByDayQueryKey(data),
    queryFn: ({ pageParam = 0 }) =>
      getSustainabilitySingleUserOverviewByDay({ page: pageParam, size: 100, direction, ...data }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.pagination.hasNext ? lastPageParam + 1 : undefined,
  })
}
