import { getConfig } from "@repo/config"

import { indexerQueryClient } from "@/api/indexer/api"
import { paths } from "@/api/indexer/schema"

const config = getConfig()

type TransfersResponse = paths["/api/v1/transfers"]["get"]["responses"]["200"]["content"]["*/*"]

export type TreasuryTransfer = TransfersResponse["data"][number]

export const useTreasuryTransfers = (size = 5) => {
  return indexerQueryClient.useInfiniteQuery(
    "get",
    "/api/v1/transfers",
    {
      params: {
        query: {
          address: config.treasuryContractAddress,
          tokenAddress: config.b3trContractAddress,
          eventType: ["FUNGIBLE_TOKEN"],
          direction: "DESC",
          size,
        },
      },
    },
    {
      pageParamName: "page",
      initialPageParam: 0,
      getNextPageParam: (lastPage: TransfersResponse, _allPages: TransfersResponse[], lastPageParam: unknown) => {
        return lastPage.pagination.hasNext ? (lastPageParam as number) + 1 : undefined
      },
    },
  )
}
