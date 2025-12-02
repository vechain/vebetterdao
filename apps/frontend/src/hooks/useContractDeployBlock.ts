import { indexerQueryClient } from "@/api/indexer/api"

export const useContractDeployBlock = (contractAddress: string) => {
  return indexerQueryClient.useQuery(
    "get",
    "/api/v1/transactions/contract",
    {
      params: { query: { contractAddress, direction: "ASC", size: 1, page: 0 } },
    },
    {
      staleTime: Infinity,
      gcTime: Infinity,
      select: data => data.data?.[0]?.blockNumber ?? 0,
      enabled: !!contractAddress,
    },
  )
}
