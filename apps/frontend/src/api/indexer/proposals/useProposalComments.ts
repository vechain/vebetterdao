import { paths } from "../schema"

import { indexerQueryClient } from "../api"

type ProposalCommentsQuery = paths["/api/v1/b3tr/proposals/{proposalId}/comments"]["get"]

export type ProposalCommentsQueryOptions = ProposalCommentsQuery["parameters"]["query"]

type ProposalCommentsQueryResponse = ProposalCommentsQuery["responses"]["200"]["content"]["*/*"]

export type ProposalComment = ProposalCommentsQueryResponse["data"][number]

export const useProposalComments = (proposalId: string, queryOptions?: ProposalCommentsQueryOptions) => {
  const { direction = "DESC" } = queryOptions || {}
  return indexerQueryClient.useInfiniteQuery(
    "get",
    "/api/v1/b3tr/proposals/{proposalId}/comments",
    {
      params: { path: { proposalId }, query: { ...queryOptions, direction }, enabled: !!proposalId },
    },
    {
      initialPageParam: 0,
      getNextPageParam: (lastPage: ProposalCommentsQueryResponse) => lastPage.pagination.hasNext,
    },
  )
}
