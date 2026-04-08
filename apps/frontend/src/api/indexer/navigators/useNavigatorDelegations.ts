import { formatEther } from "ethers"

import { indexerQueryClient } from "../api"
import { paths } from "../schema"

type DelegationsQuery = paths["/api/v1/b3tr/navigators/delegations"]["get"]
type DelegationsQueryParams = NonNullable<DelegationsQuery["parameters"]["query"]>
type DelegationsResponse = DelegationsQuery["responses"]["200"]["content"]["*/*"]

export type DelegationEvent = DelegationsResponse["data"][number]
export type DelegationEventFormatted = DelegationEvent & {
  amountFormatted: string
  deltaFormatted: string
}

export const useNavigatorDelegations = (filters: Pick<DelegationsQueryParams, "navigator" | "citizen">, size = 50) =>
  indexerQueryClient.useQuery(
    "get",
    "/api/v1/b3tr/navigators/delegations",
    {
      params: { query: { ...filters, size, direction: "DESC" } },
    },
    {
      select: (data): DelegationEventFormatted[] =>
        data.data.map(e => ({
          ...e,
          amountFormatted: formatEther(e.amount ?? 0),
          deltaFormatted: formatEther(e.delta ?? 0),
        })),
    },
  )
