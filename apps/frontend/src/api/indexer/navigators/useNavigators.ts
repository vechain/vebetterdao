import { formatEther } from "ethers"

import { indexerQueryClient } from "../api"
import { paths } from "../schema"

type NavigatorsQuery = paths["/api/v1/b3tr/navigators"]["get"]
type NavigatorsQueryParams = NonNullable<NavigatorsQuery["parameters"]["query"]>
type NavigatorsResponse = NavigatorsQuery["responses"]["200"]["content"]["*/*"]

export type NavigatorEntity = NavigatorsResponse["data"][number]
export type NavigatorOrderBy = NavigatorsQueryParams["orderBy"]
export type SortDirection = NavigatorsQueryParams["direction"]

export type NavigatorEntityFormatted = NavigatorEntity & {
  stakeFormatted: string
  totalDelegatedFormatted: string
}

type OverviewResponse = paths["/api/v1/b3tr/navigators/overview"]["get"]["responses"]["200"]["content"]["*/*"]

export type NavigatorOverview = OverviewResponse
export type NavigatorOverviewFormatted = NavigatorOverview & {
  totalStakedFormatted: string
  totalDelegatedFormatted: string
}

const formatNavigator = (nav: NavigatorEntity): NavigatorEntityFormatted => ({
  ...nav,
  stakeFormatted: formatEther(nav.stake),
  totalDelegatedFormatted: formatEther(nav.totalDelegated),
})

export const useNavigators = (params?: NavigatorsQueryParams) =>
  indexerQueryClient.useQuery(
    "get",
    "/api/v1/b3tr/navigators",
    {
      params: { query: { size: 50, direction: "DESC", ...params } },
    },
    {
      select: data => data.data.map(formatNavigator),
    },
  )

// waitForIndexer: after registration the indexer may not have the data yet,
// so we poll every 2s until it appears (triggered via ?registered=true redirect).
export const useNavigatorByAddress = (address: string, { waitForIndexer = false } = {}) =>
  indexerQueryClient.useQuery(
    "get",
    "/api/v1/b3tr/navigators",
    {
      params: { query: { navigator: address } },
    },
    {
      enabled: !!address,
      select: data => {
        const nav = data.data[0]
        return nav ? formatNavigator(nav) : null
      },
      refetchInterval: query => {
        if (waitForIndexer && !query.state.data?.data?.[0]) return 2000
        return false
      },
    },
  )

export const useNavigatorRegistrations = (params?: Omit<NavigatorsQueryParams, "status">) =>
  useNavigators({ ...params, status: ["ACTIVE", "EXITING"] })

export const useNavigatorOverview = () =>
  indexerQueryClient.useQuery(
    "get",
    "/api/v1/b3tr/navigators/overview",
    {},
    {
      select: (data): NavigatorOverviewFormatted => ({
        ...data,
        totalStakedFormatted: formatEther(data.totalStaked),
        totalDelegatedFormatted: formatEther(data.totalDelegated),
      }),
    },
  )
