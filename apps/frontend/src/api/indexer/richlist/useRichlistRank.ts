import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"

const config = getConfig()
const baseUrl = config.indexerUrl?.replace("/api/v1", "") ?? ""

export type RichlistRankResponse = {
  address: string
  balance: string
  rank: number
  totalHolders: number
  topPercentage: number
}

const fetchRichlistRank = async (address: string, scope: string): Promise<RichlistRankResponse> => {
  const params = new URLSearchParams({ scope })
  const res = await fetch(`${baseUrl}/api/v1/b3tr/richlist/${address}?${params}`, {
    headers: { "x-project-id": "B3tr Governor" },
  })
  if (!res.ok) throw new Error("Failed to fetch richlist rank")
  return res.json()
}

/**
 * Fetches the user's rank among all token holders.
 * @param address Wallet address
 * @param scope Token scope: "ALL" | "B3TR" | "VOT3"
 */
export const useRichlistRank = (address?: string, scope: "ALL" | "B3TR" | "VOT3" = "VOT3") => {
  return useQuery({
    queryKey: ["richlist-rank", address, scope],
    queryFn: () => fetchRichlistRank(address!, scope),
    enabled: !!address,
    staleTime: 1000 * 60 * 5,
  })
}
