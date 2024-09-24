import { buildQueryString } from "@/api/utils"
import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import {
  SustainabilityUserOverviewResponse,
  SustainabilityUserOverviewResponseSchema,
} from "./useSustainabilityUserOverview"

const indexerUrl = getConfig().indexerUrl

type SustainabilityAppOverviewRequest = {
  appId: string
  roundId?: number
  page: number
  size: number
  direction: "asc" | "desc"
}

/**
 * Get the sustainability overview for an app, with the given request data
 * @param data  the request data @see SustainabilityAppOverviewRequest
 * @returns the response data @see SustainabilityUserOverviewResponse
 */
export const getSustainabilityAppOverview = async (
  data: SustainabilityAppOverviewRequest,
): Promise<SustainabilityUserOverviewResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")

  const queryString = buildQueryString(data)

  const response = await fetch(`${indexerUrl}/sustainability/app/overviews?${queryString}`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch sustainability app overview: ${response.statusText}`)
  }

  return SustainabilityUserOverviewResponseSchema.parse(await response.json())
}

export const getSustainabilityAppOverviewQueryKey = (data: SustainabilityAppOverviewRequest) => [
  "SUSTAINABILITY",
  "APP_OVERVIEW",
  data.appId,
  data.roundId,
  data.page,
  data.size,
  data.direction,
]

/**
 * Get the sustainability overview for an app, with the given request data
 * @param data the request data @see SustainabilityAppOverviewRequest
 * @returns the query object with the data @see SustainabilityUserOverviewResponse
 */
export const useSustainabilityAppOverview = (data: SustainabilityAppOverviewRequest) => {
  return useQuery({
    queryKey: getSustainabilityAppOverviewQueryKey(data),
    queryFn: async () => await getSustainabilityAppOverview(data),
    enabled: !!data,
  })
}
