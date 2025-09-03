import { buildQueryString } from "@/api/utils"
import { TransactionType } from "@/constants"
import { getConfig } from "@repo/config"
import { useInfiniteQuery } from "@tanstack/react-query"

const indexerUrl = getConfig().indexerUrl

export interface TransactionsResponse {
  pagination: {
    hasNext: boolean
  }
  data: B3trTransaction[]
}

export interface B3trTransaction {
  blockNumber: number
  blockTimestamp: number
  user: string
  txId: string
  amountB3TR?: number
  amountVOT3?: number
  txType: "SWAP" | "CLAIM_REWARD" | "PROPOSAL_SUPPORT" | "UPGRADE_GM" | "B3TR_ACTION"
  appId?: string
  proof?: {
    version: number
    proof?: {
      image?: string
    }
    impact?: {
      carbon?: number
      water?: number
      energy?: number
      waste_mass?: number
      plastic?: number
      trees_planted?: number
      calories_burned?: number
      clean_energy_production_wh?: number
    }
  }
}

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

  const res = await response.json()
  return res
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
