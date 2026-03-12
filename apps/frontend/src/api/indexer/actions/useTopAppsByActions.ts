import { indexerQueryClient } from "../api"

export const useTopAppsByActions = (roundId?: number, size = 3) => {
  return indexerQueryClient.useQuery(
    "get",
    "/api/v1/b3tr/actions/leaderboards/apps",
    {
      params: { query: { roundId, size, sortBy: "actionsRewarded", direction: "DESC" } },
    },
    {
      enabled: !!roundId,
      select: data => data.data,
    },
  )
}
