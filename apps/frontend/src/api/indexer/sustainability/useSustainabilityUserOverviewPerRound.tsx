import { buildQueryString } from "@/api/utils"
import { getConfig } from "@repo/config"
import { useInfiniteQuery } from "@tanstack/react-query"

import { z } from "zod"
import { TotalImpactSchema } from "./schemas"

const indexerUrl = getConfig().indexerUrl

export const SustainabilityUserOverviewPerRoundResponseSchema = z.object({
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
        totalImpact: TotalImpactSchema.optional(),
      }),
    )
    .optional(),
})

export type SustainabilityUserOverviewPerRoundResponse = z.infer<
  typeof SustainabilityUserOverviewPerRoundResponseSchema
>

type SustainabilityUserOverviewPerRoundRequest = {
  wallet?: string
  roundId?: number | string
  page?: number
  size?: number
  direction?: "asc" | "desc"
  sortBy?: "totalRewardAmount" | "actionsRewarded" | "roundId"
}

/**
 * Get the sustainability overview for a user with the given request data
 * @param data  the request data @see SustainabilityUserOverviewRequest
 * @returns the response data @see SustainabilityUserOverviewResponse
 */
export const getSustainabilityUserOverviewPerRound = async (
  data: SustainabilityUserOverviewPerRoundRequest,
): Promise<SustainabilityUserOverviewPerRoundResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")
  if (!data.wallet && !data.roundId) throw new Error("Wallet or roundId is required")

  const queryString = buildQueryString(data)

  const response = await fetch(`${indexerUrl}/sustainability/user/round/overviews?${queryString}`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch sustainability user overview: ${response.statusText}`)
  }

  return SustainabilityUserOverviewPerRoundResponseSchema.parse(await response.json())
}

export const getSustainabilityUserOverviewPerRoundQueryKey = (
  data: Omit<SustainabilityUserOverviewPerRoundRequest, "page" | "size">,
) => ["SUSTAINABILITY", "USER_OVERVIEW_PER_ROUND", data.wallet, data.roundId, data.direction]

/**
 * Get the sustainability overview for a user, with the given request data
 * @param data the request data @see SustainabilityUserOverviewRequest
 * @returns the query object with the data @see SustainabilityUserOverviewResponse
 */
export const useSustainabilityUserOverviewPerRound = ({
  wallet,
  roundId,
  direction = "asc",
}: Omit<SustainabilityUserOverviewPerRoundRequest, "page" | "size">) => {
  return useInfiniteQuery({
    enabled: !!wallet || !!roundId,
    queryKey: getSustainabilityUserOverviewPerRoundQueryKey({
      wallet,
      roundId,
      direction,
    }),
    queryFn: ({ pageParam = 0 }) =>
      getSustainabilityUserOverviewPerRound({ page: pageParam, size: 10, wallet, roundId, direction }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.pagination.hasNext ? lastPageParam + 1 : undefined,
  })
}
