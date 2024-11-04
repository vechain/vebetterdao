import { buildQueryString } from "@/api/utils"
import { getConfig } from "@repo/config"
import { useInfiniteQuery } from "@tanstack/react-query"
import { z } from "zod"

const indexerUrl = getConfig().indexerUrl

type SustainabilityAppOverviewByDayRequest = {
  appId: string
  startDate?: string
  endDate?: string
  page?: number
  size?: number
  direction: "asc" | "desc"
}

export const SustainabilityAppOverviewByDayRequestResponseSchema = z.object({
  pagination: z.object({
    hasNext: z.boolean(),
  }),
  data: z
    .array(
      z.object({
        entity: z.string(),
        date: z.string(),
        actionsRewarded: z.number(),
        totalRewardAmount: z.number(),
        totalImpact: z
          .object({
            carbon: z.number().optional(),
            water: z.number().optional(),
            energy: z.number().optional(),
            waste_mass: z.number().optional(),
            waste_items: z.number().optional(),
            waste_reduction: z.number().optional(),
            biodiversity: z.number().optional(),
            people: z.number().optional(),
            timber: z.number().optional(),
            plastic: z.number().optional(),
            learning_time: z.number().optional(),
          })
          .optional(),
      }),
    )
    .optional(),
})

export type SustainabilityAppOverviewByDayRequestResponse = z.infer<
  typeof SustainabilityAppOverviewByDayRequestResponseSchema
>

export const getSustainabilityAppOverviewByDay = async (
  data: SustainabilityAppOverviewByDayRequest,
): Promise<SustainabilityAppOverviewByDayRequestResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")

  const queryString = buildQueryString(data)

  const response = await fetch(`${indexerUrl}/sustainability/app/day/overviews?${queryString}`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch sustainability app overview by day: ${response.statusText}`)
  }

  return SustainabilityAppOverviewByDayRequestResponseSchema.parse(await response.json())
}

export const getSustainabilityAppOverviewByDayQueryKey = (
  data: Omit<SustainabilityAppOverviewByDayRequest, "page" | "size">,
) => ["SUSTAINABILITY", "APP_OVERVIEW_BY_DAY", data.appId, data.startDate, data.endDate, data.direction]

export const useSustainabilityAppOverviewByDay = (
  data: Omit<SustainabilityAppOverviewByDayRequest, "page" | "size">,
) => {
  return useInfiniteQuery({
    queryKey: getSustainabilityAppOverviewByDayQueryKey(data),
    queryFn: ({ pageParam = 0 }) => getSustainabilityAppOverviewByDay({ ...data, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.pagination.hasNext ? lastPageParam + 1 : undefined,
  })
}
