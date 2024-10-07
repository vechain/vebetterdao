import { buildQueryString } from "@/api/utils"
import { getConfig } from "@repo/config"
import { useInfiniteQuery } from "@tanstack/react-query"
import { z } from "zod"

const indexerUrl = getConfig().indexerUrl

export const SustainabilityActionsResponseSchema = z.object({
  pagination: z.object({
    hasNext: z.boolean(),
  }),
  data: z
    .array(
      z.object({
        blockNumber: z.number(),
        blockTimestamp: z.number(),
        appId: z.string(),
        distributor: z.string(),
        amount: z.number(),
        receiver: z.string(),

        proof: z
          .object({
            version: z.number(),
            description: z.string(),
            proof: z.object({
              image: z.string().optional(),
              link: z.string().optional(),
              text: z.string().optional(),
              video: z.string().optional(),
            }),
            impact: z
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
          })
          .optional(),
      }),
    )
    .default([]),
})

export type SustainabilityActionsResponse = z.infer<typeof SustainabilityActionsResponseSchema>

type SustainabilityActionsRequest = {
  appId?: string
  wallet?: string
  page?: number
  size?: number
  direction?: "asc" | "desc"
}

/**
 * Get the sustainability actions overview for a user or app, with the given request data
 * @param data  the request data @see SustainabilityActionsRequest
 * @returns the response data @see SustainabilityActionsResponse
 */
export const getSustainabilityActions = async (
  data: SustainabilityActionsRequest,
): Promise<SustainabilityActionsResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")
  if (!data.appId && !data.wallet) throw new Error("appId or wallet is required")

  const queryString = buildQueryString(data)

  const response = await fetch(`${indexerUrl}/sustainability/actions?${queryString}`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch sustainability actions: ${response.statusText}`)
  }

  return SustainabilityActionsResponseSchema.parse(await response.json())
}

export const getSustainabilitActionsQueryKey = (data: Omit<SustainabilityActionsRequest, "page" | "size">) => [
  "SUSTAINABILITY",
  "ACTIONS",
  data.appId,
  data.wallet,
  data.direction,
]

/**
 * Get the sustainability actions overview for a user or app, with the given request data
 * @param data the request data @see SustainabilityUserOverviewRequest
 * @returns the query object with the data @see SustainabilityActionsResponse
 */
export const useSustainabilityActions = ({
  wallet,
  appId,
  direction = "asc",
}: Omit<SustainabilityActionsRequest, "page" | "size">) => {
  return useInfiniteQuery({
    queryKey: getSustainabilitActionsQueryKey({ wallet, appId, direction }),
    queryFn: ({ pageParam = 0 }) => getSustainabilityActions({ page: pageParam, wallet, appId, direction }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.pagination.hasNext ? lastPageParam + 1 : undefined,
  })
}
