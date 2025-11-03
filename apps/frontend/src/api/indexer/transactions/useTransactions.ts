import { indexerQueryClient } from "../api"
import { paths } from "../schema"

type TransactionsQuery = paths["/api/v1/history/{account}"]["get"]
type TransactionsQueryOptions = TransactionsQuery["parameters"]["query"]
type TransactionsQueryResponse = TransactionsQuery["responses"]["200"]["content"]["*/*"]
export type Transaction = TransactionsQueryResponse["data"][number]
export type TransactionEvent = NonNullable<NonNullable<TransactionsQueryOptions>["eventName"]>[number]
export const useTransactions = (account: string, queryOptions?: TransactionsQueryOptions) => {
  const {
    // default event names
    eventName = [
      "B3TR_SWAP_VOT3_TO_B3TR",
      "B3TR_SWAP_B3TR_TO_VOT3",
      "B3TR_PROPOSAL_SUPPORT",
      "B3TR_CLAIM_REWARD",
      "B3TR_UPGRADE_GM",
      "B3TR_ACTION",
      "B3TR_PROPOSAL_VOTE",
      "B3TR_XALLOCATION_VOTE",
    ],
  } = queryOptions || {}
  return indexerQueryClient.useInfiniteQuery(
    "get",
    "/api/v1/history/{account}",
    {
      params: { path: { account }, query: { ...queryOptions, eventName }, enabled: !!account },
    },
    {
      pageParamName: "page",
      initialPageParam: 0,
      getNextPageParam: (
        lastPage: TransactionsQueryResponse,
        _allPages: TransactionsQueryResponse[],
        lastPageParam: unknown,
      ) => {
        return lastPage.pagination.hasNext ? (lastPageParam as number) + 1 : undefined
      },
    },
  )
}
