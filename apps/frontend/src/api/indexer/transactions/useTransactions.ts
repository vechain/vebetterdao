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
  id: string
  blockId: string
  blockNumber: number
  blockTimestamp: number
  to: string
  from: string
  origin: string
  txId: string
  value?: number
  inputToken?: string
  outputToken?: string
  inputValue?: string
  outputValue?: string
  eventName:
    | "B3TR_SWAP_VOT3_TO_B3TR"
    | "B3TR_SWAP_B3TR_TO_VOT3"
    | "B3TR_PROPOSAL_SUPPORT"
    | "B3TR_CLAIM_REWARD"
    | "B3TR_UPGRADE_GM"
    | "B3TR_ACTION"
    | "B3TR_PROPOSAL_VOTE"
    | "B3TR_XALLOCATION_VOTE"
  appId?: string
  proof?: {
    version: number
    description?: string
    proof: {
      description?: string
      image?: string
      link?: string
      text?: string
      video?: string
    }
    impact?: {
      carbon?: number
      water?: number
      energy?: number
      waste_mass?: number
      waste_items?: number
      waste_reduction?: number
      biodiversity?: number
      people?: number
      timber?: number
      plastic?: number
      learning_time?: number
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

  const { user, ...queryParams } = data
  const queryString = buildQueryString(queryParams)

  const response = await fetch(
    `${indexerUrl}/history/${user}?eventName=B3TR_SWAP_VOT3_TO_B3TR&eventName=B3TR_SWAP_B3TR_TO_VOT3&eventName=B3TR_PROPOSAL_SUPPORT&eventName=B3TR_CLAIM_REWARD&eventName=B3TR_UPGRADE_GM&eventName=B3TR_ACTION&eventName=B3TR_PROPOSAL_VOTE&eventName=B3TR_XALLOCATION_VOTE&${queryString}`,
    {
      method: "GET",
    },
  )

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
