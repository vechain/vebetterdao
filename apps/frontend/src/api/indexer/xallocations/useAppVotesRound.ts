import { indexerQueryClient } from "../api"

export const useRoundAppVotes = (roundId: number) =>
  indexerQueryClient.useQuery("get", "/api/v1/b3tr/xallocations/{roundId}/results", { params: { path: { roundId } } })
