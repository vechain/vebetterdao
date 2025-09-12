import { buildQueryString } from "@/api/utils"
import { getConfig } from "@repo/config"
import { useInfiniteQuery } from "@tanstack/react-query"
import { z } from "zod"

const indexerUrl = getConfig().indexerUrl

export const B3trActionsResponseSchema = z.object({
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
            description: z.string().optional(),
            proof: z
              .object({
                image: z.string().optional(),
                link: z.string().optional(),
                text: z.string().optional(),
                video: z.string().optional(),
              })
              .optional(),
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

export type B3trActionsResponse = z.infer<typeof B3trActionsResponseSchema>
export type B3trProof = z.infer<typeof B3trActionsResponseSchema>["data"][number]["proof"]

type B3trActionsRequest = {
  appId?: string
  wallet: string
  before?: number
  after?: number
  page?: number
  size?: number
  direction?: "asc" | "desc"
}

/**
 * Get the B3TR actions overview for a user or app, with the given request data
 * @param data  the request data @see B3trActionsRequest
 * @returns the response data @see B3trActionsResponse
 */
export const getB3trActions = async (data: B3trActionsRequest): Promise<B3trActionsResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")

  const { wallet, ...queryParams } = data
  const queryString = buildQueryString(queryParams)

  const response = await fetch(`${indexerUrl}/b3tr/actions/users/${wallet}?${queryString}`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch B3TR actions: ${response.statusText}`)
  }

  let result

  try {
    result = await response.json()

    return B3trActionsResponseSchema.parse(result)
  } catch (e) {
    throw new Error(`Failed to parse B3TR actions: ${e}`)
  }
}

export const getB3trActionsQueryKey = (data: Omit<B3trActionsRequest, "page" | "size">) => [
  "B3TR",
  "ACTIONS",
  data.appId,
  data.wallet,
  ...(data.before ? ["BEFORE", data.before] : []),
  ...(data.after ? ["AFTER", data.after] : []),
  data.direction,
]

/**
 * Get the B3TR actions overview for a user or app, with the given request data
 * @param data the request data @see B3trActionsRequest
 * @returns the query object with the data @see B3trActionsResponse
 */
export const useB3trActions = (data: Omit<B3trActionsRequest, "page" | "size">) => {
  return useInfiniteQuery({
    queryKey: getB3trActionsQueryKey(data),
    queryFn: ({ pageParam = 0 }) => getB3trActions({ page: pageParam, ...data }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.pagination.hasNext ? lastPageParam + 1 : undefined,
  })
}
