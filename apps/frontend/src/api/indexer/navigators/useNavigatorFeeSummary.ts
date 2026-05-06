import { useQuery } from "@tanstack/react-query"
import { formatEther } from "ethers"

import { indexerFetch } from "../api"

export type NavigatorFeeSummary = {
  totalEarned: string
  totalClaimed: string
}

export type NavigatorFeeSummaryFormatted = {
  totalEarned: string
  totalClaimed: string
  totalEarnedFormatted: number
  totalClaimedFormatted: number
}

const fetchFeeSummary = async (navigator?: string): Promise<NavigatorFeeSummary> => {
  const params = new URLSearchParams()
  if (navigator) params.set("navigator", navigator)
  const res = await indexerFetch(`/api/v1/b3tr/navigators/fees/summary?${params}`)
  if (!res.ok) throw new Error(`Fee summary fetch error: ${res.status}`)
  return res.json()
}

export const getNavigatorFeeSummaryQueryKey = (navigator?: string) => ["navigator", "fees", "summary", navigator]

export const useNavigatorFeeSummary = (navigator?: string) =>
  useQuery({
    queryKey: getNavigatorFeeSummaryQueryKey(navigator),
    queryFn: () => fetchFeeSummary(navigator),
    enabled: !!navigator,
    select: (data): NavigatorFeeSummaryFormatted => ({
      ...data,
      totalEarnedFormatted: Number(formatEther(data.totalEarned || "0")),
      totalClaimedFormatted: Number(formatEther(data.totalClaimed || "0")),
    }),
  })
