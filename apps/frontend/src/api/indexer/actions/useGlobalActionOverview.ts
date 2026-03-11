import { indexerQueryClient } from "../api"

export const useGlobalActionOverview = (roundId?: number) => {
  return indexerQueryClient.useQuery(
    "get",
    "/api/v1/b3tr/actions/global/overview",
    {
      params: { query: { roundId } },
    },
    { enabled: !!roundId },
  )
}
