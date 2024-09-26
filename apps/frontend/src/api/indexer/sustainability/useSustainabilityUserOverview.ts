import { useCurrentAllocationsRoundId } from "@/api/contracts"
import { buildQueryString } from "@/api/utils"
import { getConfig } from "@repo/config"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useWallet } from "@vechain/dapp-kit-react"

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

export type SustainabilityUserOverviewResponse = z.infer<typeof SustainabilityUserOverviewResponseSchema>

type SustainabilityUserOverviewRequest = {
  wallet?: string
  roundId?: number | string
  page?: number
  size?: number
  direction?: "asc" | "desc"
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
  if (!data.wallet) throw new Error("Wallet is required")

  const queryString = buildQueryString(data)

  const response = await fetch(`${indexerUrl}/sustainability/user/overviews?${queryString}`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch sustainability user overview: ${response.statusText}`)
  }

  return SustainabilityUserOverviewResponseSchema.parse(await response.json())
}

export const getSustainabilityUserOverviewQueryKey = (
  data: Omit<SustainabilityUserOverviewRequest, "page" | "size">,
) => ["SUSTAINABILITY", "USER_OVERVIEW", data.wallet, data.roundId, data.direction]

/**
 * Get the sustainability overview for a user, with the given request data
 * @param data the request data @see SustainabilityUserOverviewRequest
 * @returns the query object with the data @see SustainabilityUserOverviewResponse
 */
export const useSustainabilityUserOverview = ({
  wallet,
  roundId,
  direction = "asc",
}: Omit<SustainabilityUserOverviewRequest, "page" | "size">) => {
  return useInfiniteQuery({
    queryKey: getSustainabilityUserOverviewQueryKey({
      wallet,
      roundId,
      direction,
    }),
    queryFn: ({ pageParam = 0 }) =>
      getSustainabilityUserOverview({ page: pageParam, size: 100, wallet, roundId, direction }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.pagination.hasNext ? lastPageParam + 1 : undefined,
  })
}

/**
 * Get the sustainability overview for the current user in the current round
 * @returns the query object with the data @see SustainabilityUserOverviewResponse
 */
export const useCurrentSustainabilityOverview = () => {
  const { account } = useWallet()
  const {
    data: currentRound,
    isLoading: isCurrentRoundLoading,
    isError: isCurrentRoundError,
    error: currentRoundError,
  } = useCurrentAllocationsRoundId()

  const {
    data: rawResults,
    isLoading: isRawResultsLoading,
    isError: isRawResultsError,
    error: rawResultsError,
  } = useSustainabilityUserOverview({
    wallet: account ?? undefined,
    roundId: currentRound ?? undefined,
    direction: "desc",
  })

  const userOverview = rawResults?.pages.map(page => page.data).flat()?.[0] ?? undefined

  return {
    data: userOverview,
    isLoading: isCurrentRoundLoading || isRawResultsLoading,
    isError: isCurrentRoundError || isRawResultsError,
    error: currentRoundError || rawResultsError,
  }
}
