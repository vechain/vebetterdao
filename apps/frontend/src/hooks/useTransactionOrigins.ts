import { useQueries } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"

export const useTransactionOrigins = (txIds: string[]): { data: Record<string, string>; isLoading: boolean } => {
  const thor = useThor()
  const uniqueIds = Array.from(new Set(txIds.filter(Boolean)))

  const results = useQueries({
    queries: uniqueIds.map(txId => ({
      queryKey: ["transaction", txId] as const,
      queryFn: async () => {
        const tx = await thor.transactions.getTransaction(txId)
        return { txId, origin: tx?.origin ?? "" }
      },
      enabled: !!thor && !!txId,
      staleTime: 5 * 60 * 1000,
    })),
  })

  const data: Record<string, string> = {}
  for (const result of results) {
    if (result.data?.origin) {
      data[result.data.txId] = result.data.origin
    }
  }

  return {
    data,
    isLoading: results.some(r => r.isLoading),
  }
}
