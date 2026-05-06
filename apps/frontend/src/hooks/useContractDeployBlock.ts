import { getConfig } from "@repo/config"
import { AppEnv } from "@repo/config/contracts"

import { indexerQueryClient } from "@/api/indexer/api"

export const useContractDeployBlock = (contractAddress: string) => {
  // When running locally, we do not have an indexer running, so we return 0, to not block the app from loading
  if (getConfig().environment === AppEnv.LOCAL || getConfig().environment === AppEnv.TESTNET)
    return { data: 0, isLoading: false, error: null } as ReturnType<typeof indexerQueryClient.useQuery>

  return indexerQueryClient.useQuery(
    "get",
    "/api/v1/transactions/contract",
    {
      params: { query: { contractAddress, direction: "ASC", size: 1, page: 0 } },
    },
    {
      staleTime: Infinity,
      gcTime: Infinity,
      select: data => data.data?.[0]?.blockNumber,
      enabled: !!contractAddress,
    },
  )
}
