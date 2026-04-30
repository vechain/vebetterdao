import { useInfiniteQuery } from "@tanstack/react-query"
import { formatEther } from "ethers"

import { indexerFetch } from "../api"

export type NavigatorFeeEntry = {
  navigator: string
  roundId: string
  totalDeposited: string
  claimed: boolean
  claimedAt: number | null
  depositedAt: number
  unlockRound: number
}

export type NavigatorFeeEntryFormatted = NavigatorFeeEntry & {
  totalDepositedFormatted: number
}

type FeeHistoryResponse = {
  data: NavigatorFeeEntry[]
  pagination: { hasNext: boolean }
}

const fetchFeeHistory = async (navigator: string, page: number, size: number): Promise<FeeHistoryResponse> => {
  const params = new URLSearchParams({
    navigator,
    page: String(page),
    size: String(size),
  })
  const res = await indexerFetch(`/api/v1/b3tr/navigators/fees/history?${params}`)
  if (!res.ok) throw new Error(`Fee history fetch error: ${res.status}`)
  return res.json()
}

const formatEntries = (data: FeeHistoryResponse): NavigatorFeeEntryFormatted[] =>
  data.data.map(entry => ({
    ...entry,
    totalDepositedFormatted: Number(formatEther(entry.totalDeposited || "0")),
  }))

export const getNavigatorFeeHistoryQueryKey = (navigator: string) => ["navigator", "fees", "history", navigator]

export const useNavigatorFeeHistory = (navigator: string, size = 20) =>
  useInfiniteQuery({
    queryKey: getNavigatorFeeHistoryQueryKey(navigator),
    queryFn: ({ pageParam }) => fetchFeeHistory(navigator, pageParam, size),
    enabled: !!navigator,
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.pagination.hasNext ? lastPageParam + 1 : undefined,
    select: data => ({
      ...data,
      pages: data.pages.map(page => formatEntries(page)),
    }),
  })
