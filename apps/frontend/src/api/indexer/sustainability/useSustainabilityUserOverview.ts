import { buildQueryString } from "@/api/utils"
import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"

import { z } from "zod"

const indexerUrl = getConfig().indexerUrl

export const SustainabilityUserOverviewResponseSchema = z.object({
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
        totalImpact: z.object({
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
        }),
      }),
    )
    .optional(),
})

export type SustainabilityUserOverviewResponse = z.infer<typeof SustainabilityUserOverviewResponseSchema>

type SustainabilityUserOverviewRequest = {
  wallet: string
  roundId?: number
  page: number
  size: number
  direction: "asc" | "desc"
}

/**
 * Get the sustainability overview for a user with the given request data
 * @param data  the request data @see SustainabilityUserOverviewRequest
 * @returns the response data @see SustainabilityUserOverviewResponse
 */
export const getSustainabilityUserOverview = async (
  data: SustainabilityUserOverviewRequest,
): Promise<SustainabilityUserOverviewResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")

  const queryString = buildQueryString(data)

  const response = await fetch(`${indexerUrl}/sustainability/user/overviews?${queryString}`, {
    method: "GET",
  })

  return SustainabilityUserOverviewResponseSchema.parse(await response.json())
}

export const getSustainabilityUserOverviewQueryKey = (data: SustainabilityUserOverviewRequest) => [
  "SUSTAINABILITY",
  "USER_OVERVIEW",
  data.wallet,
  data.roundId,
  data.page,
  data.size,
  data.direction,
]

/**
 * Get the sustainability overview for a user, with the given request data
 * @param data the request data @see SustainabilityUserOverviewRequest
 * @returns the query object with the data @see SustainabilityUserOverviewResponse
 */
export const useSustainabilityUserOverview = (data: SustainabilityUserOverviewRequest) => {
  return useQuery({
    queryKey: getSustainabilityUserOverviewQueryKey(data),
    queryFn: async () => await getSustainabilityUserOverview(data),
    enabled: !!data,
  })
}
