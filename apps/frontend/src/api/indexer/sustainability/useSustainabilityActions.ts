import { buildQueryString } from "@/api/utils"
import { getConfig } from "@repo/config"
import { useInfiniteQuery } from "@tanstack/react-query"
import { z } from "zod"
import dayjs from "dayjs"

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

/**
 * Mock version of useSustainabilityActions that returns 20 activities from the past 30 days
 */
export const useSustainabilityActionsMock = () => {
  const generateMockData = (): SustainabilityActionsResponse => {
    const now = dayjs()
    const data = Array.from({ length: 20 }, (_, index) => ({
      blockNumber: 1000000 + index,
      blockTimestamp: now.subtract(index % 7, "day").unix(),
      appId: "0x899de0d0f0b39e484c8835b2369194c4c102b230c813862db383d44a4efe14d3",
      distributor: `0x${Math.random().toString(16).substr(2, 40)}`,
      amount: Math.floor(Math.random() * 100) + 1,
      receiver: `0x${Math.random().toString(16).substr(2, 40)}`,
      proof: {
        version: 1,
        description: `Mock action ${index + 1}`,
        proof: {
          text: `This is a mock action ${index + 1}`,
          image: "https://placehold.co/600x400",
          video: "https://placehold.co/600x400",
          link: "https://x.com/HEMJAPAN/status/1838129990677770276",
        },
        impact: {
          carbon: Math.random() * 10,
          water: Math.random() * 100,
          energy: Math.random() * 50,
        },
      },
    }))

    return {
      pagination: {
        hasNext: false,
      },
      data,
    }
  }

  return useInfiniteQuery({
    queryKey: ["MOCK_SUSTAINABILITY_ACTIONS"],
    queryFn: () => generateMockData(),
    initialPageParam: 0,
    getNextPageParam: () => undefined, // Only one page in this mock
  })
}
