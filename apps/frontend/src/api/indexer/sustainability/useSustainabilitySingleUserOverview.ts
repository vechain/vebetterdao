import { z } from "zod"
import { SustainabilityMultipleUsersOverviewObjectSchema } from "./useSustainabilityUserOverview"
import { buildQueryString } from "@/api/utils"
import { useQuery } from "@tanstack/react-query"
import { getConfig } from "@repo/config"
import { useWallet } from "@vechain/dapp-kit-react"
import { useCurrentAllocationsRoundId } from "@/api/contracts"

const indexerUrl = getConfig().indexerUrl

const SustainabilitySingleUserOverviewObjectSchema = SustainabilityMultipleUsersOverviewObjectSchema.extend({
  rankByReward: z.number(),
  rankByActionsRewarded: z.number(),
  uniqueXAppInteractions: z.array(z.string()),
  roundId: z.number().optional(),
})

export const SustainabilitySingleUserOverviewResponseSchema = SustainabilitySingleUserOverviewObjectSchema

export type SustainabilitySingleUserOverviewResponse = z.infer<typeof SustainabilitySingleUserOverviewResponseSchema>

type SustainabilitySingleUserOverviewRequest = {
  wallet?: string
  roundId?: number | string
}

/**
 * Get the sustainability overview for a user
 * @param data  the request data @see SustainabilitySingleUserOverviewRequest
 * @returns the response data @see SustainabilitySingleUserOverviewResponse
 */
export const getSustainabilitySingleUserOverview = async ({
  wallet,
  roundId,
}: SustainabilitySingleUserOverviewRequest): Promise<SustainabilitySingleUserOverviewResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")
  if (!wallet) throw new Error("Wallet is required")

  const queryString = buildQueryString({ roundId })
  const endpoint = `${indexerUrl}/sustainability/user/${wallet}/overview`
  const response = await fetch(`${endpoint}?${queryString}`, {
    method: "GET",
  })

  if (!response.ok) {
    if (response.status === 404) {
      return {
        entity: wallet,
        actionsRewarded: 0,
        totalRewardAmount: 0,
        rankByReward: 0,
        rankByActionsRewarded: 0,
        uniqueXAppInteractions: [],
        ...(roundId ? { roundId: Number(roundId) } : {}),
      }
    }
    throw new Error(`Failed to fetch sustainability user overview: ${response.statusText}`)
  }

  return SustainabilitySingleUserOverviewResponseSchema.parse(await response.json())
}

export const getSustainabilitySingleUserOverviewQueryKey = (data: SustainabilitySingleUserOverviewRequest) => [
  "SUSTAINABILITY",
  "USER_OVERVIEW",
  data.wallet,
  data.roundId ? data.roundId : "ALL_ROUNDS",
]

/**
 * Get the sustainability overview for a user for all rounds
 * @param data the request data @see SustainabilitySingleUserOverviewRequest
 * @returns the query object with the data @see SustainabilitySingleUserOverviewResponse
 */
export const useSustainabilitySingleUserOverview = (data: SustainabilitySingleUserOverviewRequest) => {
  return useQuery({
    queryKey: getSustainabilitySingleUserOverviewQueryKey(data),
    queryFn: () => getSustainabilitySingleUserOverview(data),
    enabled: !!data.wallet,
  })
}

/**
 * Get the sustainability overview for the current user for the current round
 */
export const useSustainabilityCurrentUserOverview = () => {
  const { account } = useWallet()
  const { data: currentRound } = useCurrentAllocationsRoundId()
  return useQuery({
    queryKey: getSustainabilitySingleUserOverviewQueryKey({
      wallet: account ?? "",
      roundId: currentRound ?? "",
    }),
    queryFn: () =>
      getSustainabilitySingleUserOverview({
        wallet: account ?? "",
        roundId: currentRound ?? "",
      }),
    enabled: !!account && !!currentRound,
  })
}
