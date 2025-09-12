import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"

const indexerUrl = getConfig().indexerUrl

// Valid GM level names based on backend enum
export const GMLevelNameSchema = z.enum([
  "ALL",
  "EARTH",
  "MOON",
  "MERCURY",
  "VENUS",
  "MARS",
  "JUPITER",
  "SATURN",
  "URANUS",
  "NEPTUNE",
  "GALAXY",
])

export type GMLevelName = z.infer<typeof GMLevelNameSchema>

// Single GM level overview shape
export const GMLevelOverviewSchema = z.object({
  level: GMLevelNameSchema,
  totalNFTs: z.number(),
})

// Full API response (array)
export const GMLevelOverviewResponseSchema = z.array(GMLevelOverviewSchema)

export type GMLevelOverview = z.infer<typeof GMLevelOverviewSchema>
export type GMLevelOverviewResponse = z.infer<typeof GMLevelOverviewResponseSchema>

/**
 * Fetches the GM Level Overview from the indexer API.
 * Supports optional filtering by level.
 *
 * @param level Optional level to filter by (e.g., "EARTH")
 * @returns Array of GM Level Overview objects
 */
export const getGMLevelOverview = async (level?: GMLevelName): Promise<GMLevelOverviewResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")

  const query = level ? `?level=${encodeURIComponent(level)}` : ""

  const response = await fetch(`${indexerUrl}/gm-nfts/level-overview${query}`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch GM Level Overview: ${response.statusText}`)
  }

  return GMLevelOverviewResponseSchema.parse(await response.json())
}

/**
 * React Query key for caching
 */
export const gmLevelOverviewQueryKey = (level?: GMLevelName) => ["GM_LEVEL_OVERVIEW", level] as const

/**
 * React Query hook to fetch GM Level Overview data.
 *
 * @param level Optional level to filter by
 * @returns Result of the query
 */
export const useGMLevelsOverview = (level?: GMLevelName) => {
  return useQuery({
    queryKey: gmLevelOverviewQueryKey(level),
    queryFn: () => getGMLevelOverview(level),
  })
}
