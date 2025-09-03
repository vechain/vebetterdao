import { buildQueryString } from "@/api/utils"
import { TransactionType } from "@/constants"
import { getConfig } from "@repo/config"
import { useInfiniteQuery } from "@tanstack/react-query"
import { z } from "zod"

const indexerUrl = getConfig().indexerUrl

export const TransactionsResponseSchema = z.object({
  pagination: z.object({
    hasNext: z.boolean(),
  }),
  data: z
    .array(
      z.object({
        blockNumber: z.number(),
        blockTimestamp: z.number(),
        user: z.string(),
        txId: z.string(),
        amountB3TR: z.number().optional(),
        amountVOT3: z.number().optional(),
        txType: z.enum(["SWAP", "CLAIM_REWARD", "PROPOSAL_SUPPORT", "UPGRADE_GM", "B3TR_ACTION"]),
        appId: z.string().optional(),
        proof: z
          .object({
            version: z.number(),
            proof: z
              .object({
                image: z.string().optional(),
              })
              .optional(),
            impact: z
              .object({
                carbon: z.number().optional(),
                water: z.number().optional(),
                energy: z.number().optional(),
                waste_mass: z.number().optional(),
                plastic: z.number().optional(),
                trees_planted: z.number().optional(),
                calories_burned: z.number().optional(),
                clean_energy_production_wh: z.number().optional(),
              })
              .optional(),
          })
          .optional(),
      }),
    )
    .default([]),
})

export type TransactionsResponse = z.infer<typeof TransactionsResponseSchema>
export type B3trTransaction = z.infer<typeof TransactionsResponseSchema>["data"][number]

type TransactionsRequest = {
  user: string
  txType?: TransactionType
  before?: number
  after?: number
  page?: number
  size?: number
  direction?: "asc" | "desc"
}

/**
 * Get the transactions for a user, with the given request data
 * @param data  the request data @see TransactionsRequest
 * @returns the response data @see TransactionsResponse
 */
export const getTransactions = async (data: TransactionsRequest): Promise<TransactionsResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")
  if (!data.user) throw new Error("wallet is required")

  const queryString = buildQueryString(data)

  const response = await fetch(`${indexerUrl}/b3tr-txs?${queryString}`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.statusText}`)
  }
  try {
    const result = await response.json()

    return TransactionsResponseSchema.parse(result)
  } catch (e) {
    console.error(e)
    throw new Error("Failed to parse response")
  }
}

export const getTransactionsQueryKey = (data: Omit<TransactionsRequest, "page" | "size">) => [
  "TRANSACTIONS",
  data.user,
  data.direction,
  data.txType,
]

/**
 * Get the transactions for a user, with the given request data
 * @param data the request data @see TransactionsRequest
 * @returns the query object with the data @see TransactionsResponse
 */
export const useTransactions = ({ user, direction = "desc", txType, size }: Omit<TransactionsRequest, "page">) => {
  return useInfiniteQuery({
    queryKey: getTransactionsQueryKey({ user, direction, txType }),
    queryFn: ({ pageParam = 0 }) =>
      getTransactions({ page: pageParam, user, direction, txType, ...(size && { size }) }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.pagination.hasNext ? lastPageParam + 1 : undefined,
  })
}
