import { buildQueryString } from "@/api/utils"
import { getConfig } from "@repo/config"
import { useInfiniteQuery } from "@tanstack/react-query"
import { z } from "zod"

const indexerUrl = getConfig().indexerUrl

type SustainabilityAppOverviewByRoundRequest = {
  appId: string
  roundId?: number
  page?: number
  size?: number
  direction: "asc" | "desc"
}

export const SustainabilityAppOverviewByRoundResponseSchema = z.object({
  pagination: z.object({
    hasNext: z.boolean(),
  }),
  data: z
    .array(
      z.object({
        entity: z.string(),
        roundId: z.number(),
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

export type SustainabilityAppOverViewByRoundResponse = z.infer<typeof SustainabilityAppOverviewByRoundResponseSchema>

export const getSustainabilityAppOverviewByRound = async (
  data: SustainabilityAppOverviewByRoundRequest,
): Promise<SustainabilityAppOverViewByRoundResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")

  const queryString = buildQueryString(data)

  const response = await fetch(`${indexerUrl}/sustainability/app/round/overviews?${queryString}`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch sustainability app overview by day: ${response.statusText}`)
  }

  return SustainabilityAppOverviewByRoundResponseSchema.parse(await response.json())
}

export const getSustainabilityAppOverviewByRoundQueryKey = (
  data: Omit<SustainabilityAppOverviewByRoundRequest, "page" | "size">,
) => ["SUSTAINABILITY", "APP_OVERVIEW_BY_ROUND", data.appId, data.roundId, data.direction]

export const useSustainabilityAppOverviewByRound = (
  data: Omit<SustainabilityAppOverviewByRoundRequest, "page" | "size">,
) => {
  return useInfiniteQuery({
    queryKey: getSustainabilityAppOverviewByRoundQueryKey(data),
    queryFn: ({ pageParam = 0 }) => getSustainabilityAppOverviewByRound({ ...data, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.pagination.hasNext ? lastPageParam + 1 : undefined,
  })
}
