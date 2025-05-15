import { buildQueryString } from "@/api/utils"
import { getConfig } from "@repo/config"
import { useInfiniteQuery } from "@tanstack/react-query"
import { z } from "zod"

const indexerUrl = getConfig().indexerUrl

export const ProposalCommentSchema = z.object({
  blockNumber: z.number(),
  blockTimestamp: z.number(),
  voter: z.string(),
  proposalId: z.string(),
  support: z.enum(["FOR", "AGAINST", "ABSTAIN"]),
  weight: z.string(),
  power: z.string(),
  reason: z.string(),
})

export const ProposalCommentsResponseSchema = z.object({
  pagination: z.object({
    hasNext: z.boolean(),
  }),
  data: z.array(ProposalCommentSchema).default([]),
})

export type ProposalCommentsResponse = z.infer<typeof ProposalCommentsResponseSchema>
export type ProposalComment = z.infer<typeof ProposalCommentSchema>

type ProposalCommentsRequest = {
  proposalId?: string
  voter?: string
  support?: "FOR" | "AGAINST" | "ABSTAIN"
  page?: number
  size?: number
  direction?: "asc" | "desc"
}

/**
 * Fetches comments for a specific proposal.
 *
 * @param data - The request data containing the proposal ID and other query parameters.
 * @returns A promise that resolves to the proposal comments response.
 * @throws Will throw an error if the indexer URL is not found or if the proposal ID is missing.
 * @throws Will throw an error if the fetch request fails.
 */
export const getProposalComments = async (data: ProposalCommentsRequest): Promise<ProposalCommentsResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")
  if (!data.proposalId) throw new Error("proposalId is required")

  const queryString = buildQueryString(data)

  const response = await fetch(`${indexerUrl}/voting/proposals/comments?${queryString}`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch proposal comments: ${response.statusText}`)
  }

  return ProposalCommentsResponseSchema.parse(await response.json())
}

export const getProposalCommentsQueryKey = (data: Omit<ProposalCommentsRequest, "page" | "size">) => [
  "PROPOSAL",
  "COMMENTS",
  data.proposalId,
  data.voter,
  data.support,
  data.direction,
]

export const useProposalComments = ({
  proposalId,
  voter,
  support,
  direction = "desc",
  size = 5,
}: Omit<ProposalCommentsRequest, "page">) => {
  return useInfiniteQuery({
    queryKey: getProposalCommentsQueryKey({ proposalId, voter, support, direction }),
    queryFn: ({ pageParam = 0 }) =>
      getProposalComments({ page: pageParam, size, proposalId, voter, support, direction }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.pagination.hasNext ? lastPageParam + 1 : undefined,
  })
}
