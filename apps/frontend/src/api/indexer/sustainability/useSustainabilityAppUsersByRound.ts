import { buildQueryString } from "@/api/utils"
import { getConfig } from "@repo/config"
import { useInfiniteQuery } from "@tanstack/react-query"
import { z } from "zod"

const indexerUrl = getConfig().indexerUrl

type SustainabilityAppUsersByRoundRequest = {
  appId: string
  roundId: number
  page?: number
  size?: number
  direction: "asc" | "desc"
  sortBy: "totalRewardAmount" | "actionsRewarded"
}

export const SustainabilityAppUsersByRoundResponseSchema = z.object({
  pagination: z.object({
    hasNext: z.boolean(),
  }),
  data: z
    .array(
      z.object({
        appId: z.string(),
        user: z.string(),
        roundId: z.number(),
        totalRewardAmount: z.number(),
        actionsRewarded: z.number(),
        rankByReward: z.number().optional(),
        rankByActionsRewarded: z.number().optional(),
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

export type SustainabilityAppUsersByRoundResponse = z.infer<typeof SustainabilityAppUsersByRoundResponseSchema>

export const getSustainabilityAppUsersByRound = async (
  data: SustainabilityAppUsersByRoundRequest,
): Promise<SustainabilityAppUsersByRoundResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")

  const queryString = buildQueryString(data)

  const response = await fetch(`${indexerUrl}/sustainability/app-round-overviews?${queryString}`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch sustainability app users by round: ${response.statusText}`)
  }

  return SustainabilityAppUsersByRoundResponseSchema.parse(await response.json())
}

export const getSustainabilityAppUsersByRoundQueryKey = (
  data: Omit<SustainabilityAppUsersByRoundRequest, "page" | "size">,
) => ["SUSTAINABILITY", "APP_USERS_BY_ROUND", data.appId, data.roundId, data.direction]

export const useSustainabilityAppUsersByRound = (data: Omit<SustainabilityAppUsersByRoundRequest, "page" | "size">) => {
  return useInfiniteQuery({
    queryKey: getSustainabilityAppUsersByRoundQueryKey(data),
    queryFn: ({ pageParam = 0 }) => getSustainabilityAppUsersByRound({ ...data, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.pagination.hasNext ? lastPageParam + 1 : undefined,
  })
}
