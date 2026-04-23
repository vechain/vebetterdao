/**
 * Hand-typed indexer response shapes for B3TR challenge endpoints.
 *
 * TODO: after `yarn generate:schema` includes the new `/b3tr/challenges` +
 * `/b3tr/users/{wallet}/challenges` endpoints, swap these for schema-derived
 * types from `paths` in `../schema.d.ts`.
 */

export type IndexerChallengeKind = "Stake" | "Sponsored"
export type IndexerChallengeVisibility = "Public" | "Private"
export type IndexerChallengeType = "MaxActions" | "SplitWin"
export type IndexerChallengeStatus = "Pending" | "Active" | "Completed" | "Cancelled" | "Invalid"
export type IndexerSettlementMode = "None" | "TopWinners" | "CreatorRefund" | "SplitWinCompleted"

export type IndexerChallengeFilter = "NeededAction" | "MyChallenges" | "OpenToJoin" | "OthersActive" | "History"

export interface IndexerChallengeSummary {
  challengeId: number
  createdAt: number
  kind: IndexerChallengeKind
  visibility: IndexerChallengeVisibility
  challengeType: IndexerChallengeType
  status: IndexerChallengeStatus
  settlementMode: IndexerSettlementMode
  creator: string
  title: string
  description: string
  imageURI: string
  metadataURI: string
  stakeAmount: string
  totalPrize: string
  startRound: number
  endRound: number
  duration: number
  threshold: string
  numWinners: number
  winnersClaimed: number
  prizePerWinner: string
  allApps: boolean
  participantCount: number
  invitedCount: number
  declinedCount: number
  selectedAppsCount: number
  winnersCount: number
}

export interface IndexerPagination {
  hasNext: boolean
  cursor?: string | null
}

export interface IndexerPaginatedResponse<T> {
  data: T[]
  pagination: IndexerPagination
}
