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

const formatEvents = (data: DelegationsResponse): DelegationEventFormatted[] =>
  data.data.map(e => ({
    ...e,
    amountFormatted: formatEther(e.amount ?? 0),
    deltaFormatted: formatEther(e.delta ?? 0),
  }))

export const useNavigatorDelegations = (filters: Pick<DelegationsQueryParams, "navigator" | "citizen">, size = 20) =>
  indexerQueryClient.useInfiniteQuery(
    "get",
    "/api/v1/b3tr/navigators/delegations",
    {
      params: { query: { ...filters, size, direction: "DESC" } },
    },
    {
      pageParamName: "page",
      initialPageParam: 0,
      getNextPageParam: (lastPage: DelegationsResponse, _allPages: DelegationsResponse[], lastPageParam: unknown) =>
        lastPage.pagination.hasNext ? (lastPageParam as number) + 1 : undefined,
      select: data => ({
        ...data,
        pages: data.pages.map(page => formatEvents(page)),
      }),
    },
  )
