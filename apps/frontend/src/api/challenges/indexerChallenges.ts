import { useInfiniteQuery } from "@tanstack/react-query"

import { indexerFetch } from "@/api/indexer/api"

import {
  ChallengeKind,
  ChallengeSection,
  ChallengeStatus,
  ChallengeType,
  ChallengeView,
  ChallengeVisibility,
  ParticipantStatus,
  SettlementMode,
} from "./types"

type Pagination = {
  hasNext: boolean
  cursor?: string | null
}

type PaginatedResponse<T> = {
  data: T[]
  pagination: Pagination
}

type ChallengeUiEnum =
  | keyof typeof ChallengeKind
  | keyof typeof ChallengeVisibility
  | keyof typeof ChallengeType
  | keyof typeof ChallengeStatus
  | keyof typeof SettlementMode
  | keyof typeof ParticipantStatus

type RawChallengeView = {
  challengeId: number
  createdAt: number
  kind: ChallengeUiEnum | number
  visibility: ChallengeUiEnum | number
  challengeType: ChallengeUiEnum | number
  status: ChallengeUiEnum | number
  settlementMode: ChallengeUiEnum | number
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
  maxParticipants: number
  invitedCount: number
  declinedCount: number
  selectedAppsCount: number
  winnersCount: number
  viewerStatus: ChallengeUiEnum | number
  isCreator: boolean
  isJoined: boolean
  isInvitationPending: boolean
  isSplitWinWinner: boolean
  canJoin: boolean
  canLeave: boolean
  canAccept: boolean
  canDecline: boolean
  canCancel: boolean
  canAddInvites: boolean
  canClaim: boolean
  canRefund: boolean
  canComplete: boolean
  canClaimSplitWin: boolean
  canClaimCreatorSplitWinRefund: boolean
}

const SECTION_PAGE_SIZE: Record<ChallengeSection, number> = {
  "needed-actions": 12,
  active: 6,
  open: 12,
  explore: 12,
  history: 12,
}

const challengeKindMap = {
  Stake: ChallengeKind.Stake,
  Sponsored: ChallengeKind.Sponsored,
} as const

const challengeVisibilityMap = {
  Public: ChallengeVisibility.Public,
  Private: ChallengeVisibility.Private,
} as const

const challengeTypeMap = {
  MaxActions: ChallengeType.MaxActions,
  SplitWin: ChallengeType.SplitWin,
} as const

const challengeStatusMap = {
  Pending: ChallengeStatus.Pending,
  Active: ChallengeStatus.Active,
  Completed: ChallengeStatus.Completed,
  Cancelled: ChallengeStatus.Cancelled,
  Invalid: ChallengeStatus.Invalid,
} as const

const settlementModeMap = {
  None: SettlementMode.None,
  TopWinners: SettlementMode.TopWinners,
  CreatorRefund: SettlementMode.CreatorRefund,
  SplitWinCompleted: SettlementMode.SplitWinCompleted,
} as const

const participantStatusMap = {
  None: ParticipantStatus.None,
  Invited: ParticipantStatus.Invited,
  Declined: ParticipantStatus.Declined,
  Joined: ParticipantStatus.Joined,
} as const

const normalizeEnum = <T extends number>(value: string | number, map: Record<string, T>, fallback: T): T => {
  if (typeof value === "number") return value as T
  return map[value] ?? fallback
}

export const mapIndexerChallengeView = (challenge: RawChallengeView): ChallengeView => ({
  challengeId: challenge.challengeId,
  createdAt: challenge.createdAt,
  kind: normalizeEnum(challenge.kind, challengeKindMap, ChallengeKind.Stake),
  visibility: normalizeEnum(challenge.visibility, challengeVisibilityMap, ChallengeVisibility.Public),
  challengeType: normalizeEnum(challenge.challengeType, challengeTypeMap, ChallengeType.MaxActions),
  status: normalizeEnum(challenge.status, challengeStatusMap, ChallengeStatus.Pending),
  settlementMode: normalizeEnum(challenge.settlementMode, settlementModeMap, SettlementMode.None),
  creator: challenge.creator,
  title: challenge.title,
  description: challenge.description,
  imageURI: challenge.imageURI,
  metadataURI: challenge.metadataURI,
  stakeAmount: challenge.stakeAmount,
  totalPrize: challenge.totalPrize,
  startRound: challenge.startRound,
  endRound: challenge.endRound,
  duration: challenge.duration,
  threshold: challenge.threshold,
  numWinners: challenge.numWinners,
  winnersClaimed: challenge.winnersClaimed,
  prizePerWinner: challenge.prizePerWinner,
  allApps: challenge.allApps,
  participantCount: challenge.participantCount,
  maxParticipants: challenge.maxParticipants,
  invitedCount: challenge.invitedCount,
  declinedCount: challenge.declinedCount,
  selectedAppsCount: challenge.selectedAppsCount,
  winnersCount: challenge.winnersCount,
  viewerStatus: normalizeEnum(challenge.viewerStatus, participantStatusMap, ParticipantStatus.None),
  isCreator: challenge.isCreator,
  isJoined: challenge.isJoined,
  isInvitationPending: challenge.isInvitationPending,
  isSplitWinWinner: challenge.isSplitWinWinner,
  canJoin: challenge.canJoin,
  canLeave: challenge.canLeave,
  canAccept: challenge.canAccept,
  canDecline: challenge.canDecline,
  canCancel: challenge.canCancel,
  canAddInvites: challenge.canAddInvites,
  canClaim: challenge.canClaim,
  canRefund: challenge.canRefund,
  canComplete: challenge.canComplete,
  canClaimSplitWin: challenge.canClaimSplitWin,
  canClaimCreatorSplitWinRefund: challenge.canClaimCreatorSplitWinRefund,
})

const fetchChallengeSection = async (
  section: ChallengeSection,
  wallet: string,
  page: number,
): Promise<PaginatedResponse<ChallengeView>> => {
  const params = new URLSearchParams({
    wallet,
    page: String(page),
    size: String(SECTION_PAGE_SIZE[section]),
  })

  const response = await indexerFetch(`/api/v1/b3tr/challenges/${section}?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${section}`)
  }

  const payload = (await response.json()) as PaginatedResponse<RawChallengeView>
  return {
    data: payload.data.map(mapIndexerChallengeView),
    pagination: payload.pagination,
  }
}

export const getChallengeSectionQueryKey = (section: ChallengeSection, viewerAddress?: string) => [
  "challenges",
  "hub",
  section,
  viewerAddress ?? "guest",
]

export const useChallengeSection = (section: ChallengeSection, viewerAddress?: string) => {
  return useInfiniteQuery({
    queryKey: getChallengeSectionQueryKey(section, viewerAddress),
    queryFn: ({ pageParam }) => fetchChallengeSection(section, viewerAddress!, pageParam as number),
    enabled: !!viewerAddress,
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      return lastPage.pagination.hasNext ? (lastPageParam as number) + 1 : undefined
    },
  })
}
