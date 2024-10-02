import { buildQueryString } from "@/api/utils"
import { getConfig } from "@repo/config"
import { useInfiniteQuery } from "@tanstack/react-query"
import { z } from "zod"
import dayjs from "dayjs"

const indexerUrl = getConfig().indexerUrl

export const TransactionsResponseSchema = z.object({
  pagination: z.object({
    hasNext: z.boolean(),
  }),
  data: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(["swap", "claim", "support", "gm-upgrade"]),
        blockNumber: z.number(),
        blockTimestamp: z.number(),
        amount: z.number(),
        from: z.string(),
        to: z.string(),
        data: z.object({}).passthrough(),
      }),
    )
    .default([]),
})

export type TransactionsResponse = z.infer<typeof TransactionsResponseSchema>

type TransactionsRequest = {
  wallet: string
  page?: number
  size?: number
  direction?: "asc" | "desc"
  kind?: string
}

/**
 * Get the transactions for a user, with the given request data
 * @param data  the request data @see TransactionsRequest
 * @returns the response data @see TransactionsResponse
 */
export const getTransactions = async (data: TransactionsRequest): Promise<TransactionsResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")
  if (!data.wallet) throw new Error("wallet is required")

  const queryString = buildQueryString(data)

  const response = await fetch(`${indexerUrl}/transactions?${queryString}`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.statusText}`)
  }

  return TransactionsResponseSchema.parse(await response.json())
}

export const getTransactionsQueryKey = (data: Omit<TransactionsRequest, "page" | "size">) => [
  "TRANSACTIONS",
  data.wallet,
  data.direction,
  data.kind,
]

/**
 * Get the transactions for a user, with the given request data
 * @param data the request data @see TransactionsRequest
 * @returns the query object with the data @see TransactionsResponse
 */
export const useTransactions = ({ wallet, direction = "desc", kind }: Omit<TransactionsRequest, "page" | "size">) => {
  return useInfiniteQuery({
    queryKey: getTransactionsQueryKey({ wallet, direction, kind }),
    queryFn: ({ pageParam = 0 }) => getTransactions({ page: pageParam, wallet, direction, kind }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.pagination.hasNext ? lastPageParam + 1 : undefined,
  })
}

/**
 * Mock version of useTransactions that returns 20 transactions from the past 30 days
 */
export const useTransactionsMock = ({ kind }: { kind?: string }) => {
  const generateMockData = (): TransactionsResponse => {
    const now = dayjs()
    const data = Array.from({ length: 20 }, (_, index) => ({
      id: `tx-${index + 1}`,
      type:
        kind && kind !== "all"
          ? (kind as "swap" | "claim" | "support" | "gm-upgrade")
          : (["swap", "claim", "support", "gm-upgrade"][Math.floor(Math.random() * 4)] as
              | "swap"
              | "claim"
              | "support"
              | "gm-upgrade"),
      blockNumber: 1000000 + index,
      blockTimestamp: now.subtract(index % 30, "day").unix(),
      amount: Math.floor(Math.random() * 1000) + 1,
      from: `0x${Math.random().toString(16).substr(2, 40)}`,
      to: `0x${Math.random().toString(16).substr(2, 40)}`,
      data: {},
    }))

    return {
      pagination: {
        hasNext: false,
      },
      data,
    }
  }

  return useInfiniteQuery({
    queryKey: ["MOCK_TRANSACTIONS", kind],
    queryFn: () => generateMockData(),
    initialPageParam: 0,
    getNextPageParam: () => undefined, // Only one page in this mock
  })
}
