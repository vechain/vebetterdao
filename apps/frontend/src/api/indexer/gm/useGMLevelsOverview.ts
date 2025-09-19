import { indexerQueryClient } from "../api"
import { paths } from "../schema"

type GMLevelsOverviewQuery = paths["/api/v1/b3tr/galaxy-members/level-overview"]["get"]

type GMLevelsOverviewQueryOptions = GMLevelsOverviewQuery["parameters"]["query"]

type GMLevelsOverviewQueryResponse = GMLevelsOverviewQuery["responses"]["200"]["content"]["*/*"]

export type GMLevelOverview = GMLevelsOverviewQueryResponse[number]

export const useGMLevelsOverview = (queryOptions?: GMLevelsOverviewQueryOptions) => {
  const { level = "ALL" } = queryOptions || {}
  return indexerQueryClient.useQuery("get", "/api/v1/b3tr/galaxy-members/level-overview", {
    params: { query: { ...queryOptions, level } },
  })
}
