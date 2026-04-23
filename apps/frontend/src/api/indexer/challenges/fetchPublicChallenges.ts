import { indexerFetch } from "../api"

import { IndexerChallengeStatus, IndexerChallengeSummary, IndexerPaginatedResponse } from "./types"

interface FetchPublicChallengesParams {
  status?: IndexerChallengeStatus
  page: number
  size: number
}

/**
 * Public challenges across the network (no wallet scoping). Used for guests
 * browsing the Open-to-Join / Others-Active sections without a connected wallet.
 *
 * Endpoint: `GET /api/v1/b3tr/challenges?status=&page=&size=`
 */
export const fetchPublicChallenges = async ({
  status,
  page,
  size,
}: FetchPublicChallengesParams): Promise<IndexerPaginatedResponse<IndexerChallengeSummary>> => {
  const qs = new URLSearchParams({
    page: String(page),
    size: String(size),
  })
  if (status) qs.set("status", status)

  const res = await indexerFetch(`/api/v1/b3tr/challenges?${qs.toString()}`)
  if (!res.ok) {
    throw new Error(`indexer /b3tr/challenges failed: ${res.status} ${res.statusText}`)
  }
  return res.json()
}
