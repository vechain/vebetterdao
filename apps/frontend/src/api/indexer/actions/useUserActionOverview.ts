import { z } from "zod"
import { buildQueryString } from "@/api/utils"
import { useQuery } from "@tanstack/react-query"
import { getConfig } from "@repo/config"
import { useCurrentAllocationsRoundId } from "@/api/contracts"

const indexerUrl = getConfig().indexerUrl

const TotalImpactSchema = z.object({
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
  education_time: z.number().optional(),
  trees_planted: z.number().optional(),
  calories_burned: z.number().optional(),
  clean_energy_production_wh: z.number().optional(),
  sleep_quality_percentage: z.number().optional(),
})

const UserActionOverviewObjectSchema = z.object({
  wallet: z.string(),
  actionsRewarded: z.number(),
  totalRewardAmount: z.number(),
  totalImpact: TotalImpactSchema.optional(),
  rankByReward: z.number().optional(),
  rankByActionsRewarded: z.number().optional(),
  uniqueXAppInteractions: z.array(z.string()),
  roundId: z.number().optional(),
})

export const UserActionOverviewResponseSchema = UserActionOverviewObjectSchema

export type UserActionOverviewResponse = z.infer<typeof UserActionOverviewResponseSchema>

type UserActionOverviewRequest = {
  wallet: string
  roundId?: number | string
}

/**
 * Get the action overview for a user
 * @param data  the request data @see UserActionOverviewRequest
 * @returns the response data @see UserActionOverviewResponse
 */
export const getUserActionOverview = async (data: UserActionOverviewRequest): Promise<UserActionOverviewResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")

  const { wallet, ...queryParams } = data
  const queryString = buildQueryString(queryParams)

  const endpoint = `${indexerUrl}/b3tr/actions/users/${wallet}/overview`
  const response = await fetch(`${endpoint}?${queryString}`, {
    method: "GET",
  })

  if (!response.ok) {
    if (response.status === 404) {
      return {
        wallet: wallet,
        actionsRewarded: 0,
        totalRewardAmount: 0,
        rankByReward: 0,
        rankByActionsRewarded: 0,
        uniqueXAppInteractions: [],
        ...(queryParams.roundId ? { roundId: Number(queryParams.roundId) } : {}),
      }
    }
    throw new Error(`Failed to fetch user action overview: ${response.statusText}`)
  }

  return UserActionOverviewResponseSchema.parse(await response.json())
}

export const getUserActionOverviewQueryKey = (data: UserActionOverviewRequest) => [
  "USER_ACTION_OVERVIEW",
  data.wallet,
  data.roundId ? data.roundId : "ALL_ROUNDS",
]

/**
 * Get the action overview for a user for all rounds or a specific round
 * @param data the request data @see UserActionOverviewRequest
 * @returns the query object with the data @see UserActionOverviewResponse
 */
export const useUserActionOverview = (data: UserActionOverviewRequest) => {
  return useQuery({
    queryKey: getUserActionOverviewQueryKey(data),
    queryFn: () => getUserActionOverview(data),
    enabled: !!data.wallet,
  })
}

/**
 * Get the action overview for a user for the current round
 * @param user the user wallet address
 * @returns the query object with the data @see UserActionOverviewResponse
 */
export const useUserActionCurrentRoundOverview = (user?: string) => {
  const { data: currentRound } = useCurrentAllocationsRoundId()
  return useQuery({
    queryKey: getUserActionOverviewQueryKey({
      wallet: user ?? "",
      roundId: currentRound ?? "",
    }),
    queryFn: () =>
      getUserActionOverview({
        wallet: user ?? "",
        roundId: currentRound ?? "",
      }),
    enabled: !!user && !!currentRound,
  })
}
