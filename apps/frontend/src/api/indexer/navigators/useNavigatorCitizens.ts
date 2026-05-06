import { formatEther } from "ethers"

import { indexerQueryClient } from "../api"
import { paths } from "../schema"

type CitizensResponse = paths["/api/v1/b3tr/navigators/citizens"]["get"]["responses"]["200"]["content"]["*/*"]

export type CitizenEntity = CitizensResponse["data"][number]
export type CitizenEntityFormatted = CitizenEntity & {
  amountFormatted: string
}

const formatCitizens = (data: CitizensResponse): CitizenEntityFormatted[] =>
  data.data.map(c => ({
    ...c,
    amountFormatted: formatEther(c.amount),
  }))

export const useNavigatorCitizens = (navigatorAddress: string, size = 20) =>
  indexerQueryClient.useInfiniteQuery(
    "get",
    "/api/v1/b3tr/navigators/citizens",
    {
      params: { query: { navigator: navigatorAddress, size, direction: "DESC" } },
      enabled: !!navigatorAddress,
    },
    {
      pageParamName: "page",
      initialPageParam: 0,
      getNextPageParam: (lastPage: CitizensResponse, _allPages: CitizensResponse[], lastPageParam: unknown) =>
        lastPage.pagination.hasNext ? (lastPageParam as number) + 1 : undefined,
      select: data => ({
        ...data,
        pages: data.pages.map(page => formatCitizens(page)),
      }),
    },
  )
