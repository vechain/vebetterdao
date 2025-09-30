import { useCurrentAllocationsRoundId } from "@/api/contracts"
import { indexerQueryClient } from "../api"
import { paths } from "../schema"

type UserActionOverviewQuery = paths["/api/v1/b3tr/actions/users/{wallet}/overview"]["get"]

type UserActionOverviewQueryOptions = UserActionOverviewQuery["parameters"]["query"]

export const useUserActionOverview = (
  wallet: string,
  queryOptions?: UserActionOverviewQueryOptions,
  enabled = true,
) => {
  return indexerQueryClient.useQuery(
    "get",
    "/api/v1/b3tr/actions/users/{wallet}/overview",
    {
      params: { query: queryOptions, path: { wallet } },
    },
    { enabled: !!wallet && !!enabled },
  )
}

export const useUserActionCurrentRoundOverview = (wallet: string) => {
  const { data: currentRound } = useCurrentAllocationsRoundId()
  return useUserActionOverview(wallet, { roundId: currentRound ? Number(currentRound) : undefined }, !!currentRound)
}
