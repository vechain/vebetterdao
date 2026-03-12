import { getConfig } from "@repo/config"
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query"

import type { TreasuryTransfer, TreasuryTransfersResponse } from "./types"

const config = getConfig()
const baseUrl = config.indexerUrl?.replace("/api/v1", "") ?? ""

export type { TreasuryTransfer }

export type TreasuryTransferCategory = "emission" | "surplus" | "gm_upgrade" | "grant" | "out" | "other"

const fetchTreasuryTransfers = async (
  page: number,
  category: TreasuryTransferCategory | undefined,
  size: number,
): Promise<TreasuryTransfersResponse> => {
  const params = new URLSearchParams()
  if (category) params.set("category", category)
  params.set("page", String(page))
  params.set("size", String(size))
  params.set("direction", "DESC")

  const res = await fetch(`${baseUrl}/api/v1/b3tr/treasury/transfers?${params}`)
  if (!res.ok) throw new Error("Failed to fetch treasury transfers")
  return res.json()
}

export const useTreasuryTransfers = (category: TreasuryTransferCategory | undefined, size = 20) => {
  return useInfiniteQuery({
    queryKey: ["treasury-transfers", category, size],
    queryFn: ({ pageParam }) => fetchTreasuryTransfers(pageParam as number, category, size),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.pagination.hasNext ? (lastPageParam as number) + 1 : undefined,
    placeholderData: keepPreviousData,
  })
}
