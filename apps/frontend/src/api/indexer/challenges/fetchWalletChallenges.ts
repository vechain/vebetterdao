import { indexerFetch } from "../api"

import { IndexerChallengeFilter, IndexerChallengeSummary, IndexerPaginatedResponse } from "./types"

interface FetchWalletChallengesParams {
  viewer: string
  filter: IndexerChallengeFilter
  page: number
  size: number
}

/**
 * Wallet-scoped challenge list bucketed by semantic `filter`. Each filter value
 * maps 1:1 to a section in the challenges hub UI.
 *
 * Endpoint: `GET /api/v1/b3tr/users/{wallet}/challenges?filter=&page=&size=`
 */
export const fetchWalletChallenges = async ({
  viewer,
  filter,
  page,
  size,
}: FetchWalletChallengesParams): Promise<IndexerPaginatedResponse<IndexerChallengeSummary>> => {
  const wallet = viewer.toLowerCase()
  const qs = new URLSearchParams({
    filter,
    page: String(page),
    size: String(size),
  })

  const res = await indexerFetch(`/api/v1/b3tr/users/${wallet}/challenges?${qs.toString()}`)
  if (!res.ok) {
    throw new Error(`indexer /b3tr/users/${wallet}/challenges failed: ${res.status} ${res.statusText}`)
  }
  return res.json()
}
