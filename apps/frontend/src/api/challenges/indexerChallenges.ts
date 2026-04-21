import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query"

import { indexerFetch } from "@/api/indexer/api"

import {
  ChallengeAction,
  ChallengeKind,
  ChallengePhase,
  ChallengeStatus,
  ChallengeType,
  ChallengeUserState,
  ChallengeView,
  ChallengeViewerRelation,
  ChallengeVisibility,
  ParticipantStatus,
  SettlementMode,
  UserChallengeListType,
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
  | keyof typeof ChallengePhase
  | keyof typeof SettlementMode
  | keyof typeof ParticipantStatus
  | keyof typeof ChallengeViewerRelation
  | keyof typeof ChallengeAction

export interface RawChallengeSummaryResponse {
  challengeId: number
  createdAt: number
  kind: ChallengeUiEnum | number
  visibility: ChallengeUiEnum | number
  challengeType: ChallengeUiEnum | number
  lifecycleStatus: ChallengeUiEnum | number
  phase: keyof typeof ChallengePhase | ChallengePhase
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
}

export interface RawChallengeDetailResponse extends RawChallengeSummaryResponse {
  participants: string[]
  invited: string[]
  declined: string[]
  selectedApps: string[]
  winners: string[]
}

type RawUserChallengeStateResponse = {
  challengeId: number
  createdAt: number
  viewerRelation: ChallengeUiEnum | ChallengeViewerRelation
  availableActions: Array<ChallengeUiEnum | ChallengeAction>
  participantActions: string
  isActionable: boolean
  isParticipating: boolean
  isHistorical: boolean
}

type ChallengeBase = {
  challengeId: number
  createdAt: number
  kind: ChallengeKind
  visibility: ChallengeVisibility
  challengeType: ChallengeType
  status: ChallengeStatus
  phase: ChallengePhase
  settlementMode: SettlementMode
  creator: string
  title?: string
  description?: string
  imageURI?: string
  metadataURI?: string
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
}

const PUBLIC_PAGE_SIZE = 12
const USER_PAGE_SIZE: Record<UserChallengeListType, number> = {
  actionable: 12,
  participating: 6,
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

const challengePhaseMap = {
  Upcoming: ChallengePhase.Upcoming,
  Live: ChallengePhase.Live,
  Ended: ChallengePhase.Ended,
} as const

const settlementModeMap = {
  None: SettlementMode.None,
  TopWinners: SettlementMode.TopWinners,
  CreatorRefund: SettlementMode.CreatorRefund,
  SplitWinCompleted: SettlementMode.SplitWinCompleted,
} as const

const viewerRelationMap = {
  Creator: ChallengeViewerRelation.Creator,
  Joined: ChallengeViewerRelation.Joined,
  Invited: ChallengeViewerRelation.Invited,
  Declined: ChallengeViewerRelation.Declined,
  None: ChallengeViewerRelation.None,
} as const

const challengeActionMap = {
  Join: ChallengeAction.Join,
  Leave: ChallengeAction.Leave,
  AcceptInvite: ChallengeAction.AcceptInvite,
  DeclineInvite: ChallengeAction.DeclineInvite,
  Cancel: ChallengeAction.Cancel,
  AddInvites: ChallengeAction.AddInvites,
  Claim: ChallengeAction.Claim,
  Refund: ChallengeAction.Refund,
  Complete: ChallengeAction.Complete,
  ClaimSplitWin: ChallengeAction.ClaimSplitWin,
  ClaimCreatorSplitWinRefund: ChallengeAction.ClaimCreatorSplitWinRefund,
} as const

const normalizeEnum = <T extends number | string>(value: string | number, map: Record<string, T>, fallback: T): T => {
  if (typeof value === "number") return value as T
  return map[value] ?? fallback
}

const compareAddresses = (left?: string, right?: string) =>
  !!left && !!right && left.toLowerCase() === right.toLowerCase()

const mapViewerRelationToStatus = (viewerRelation: ChallengeViewerRelation): ParticipantStatus => {
  switch (viewerRelation) {
    case ChallengeViewerRelation.Joined:
      return ParticipantStatus.Joined
    case ChallengeViewerRelation.Invited:
      return ParticipantStatus.Invited
    case ChallengeViewerRelation.Declined:
      return ParticipantStatus.Declined
    default:
      return ParticipantStatus.None
  }
}

const hasAction = (userState: ChallengeUserState | null | undefined, action: ChallengeAction) =>
  userState?.availableActions.includes(action) ?? false

const isSplitWinChallenge = (challenge: Pick<ChallengeBase, "challengeType">) =>
  challenge.challengeType === ChallengeType.SplitWin

const hasReachedParticipantLimit = (
  challenge: Pick<ChallengeBase, "challengeType" | "participantCount" | "maxParticipants">,
) => !isSplitWinChallenge(challenge) && challenge.participantCount >= challenge.maxParticipants

const deriveDefaultUserState = (challenge: ChallengeBase, viewerAddress?: string): ChallengeUserState | null => {
  if (!viewerAddress) return null

  const viewerRelation = compareAddresses(challenge.creator, viewerAddress)
    ? ChallengeViewerRelation.Creator
    : ChallengeViewerRelation.None

  const canJoin =
    challenge.status === ChallengeStatus.Pending &&
    challenge.visibility === ChallengeVisibility.Public &&
    !compareAddresses(challenge.creator, viewerAddress) &&
    !hasReachedParticipantLimit(challenge)

  return {
    challengeId: challenge.challengeId,
    createdAt: challenge.createdAt,
    viewerRelation,
    availableActions: canJoin ? [ChallengeAction.Join] : [],
    participantActions: "0",
    isActionable: false,
    isParticipating: false,
    isHistorical: false,
  }
}

const normalizeUserChallengeState = (challenge: RawUserChallengeStateResponse): ChallengeUserState => ({
  challengeId: challenge.challengeId,
  createdAt: challenge.createdAt,
  viewerRelation: normalizeEnum(challenge.viewerRelation, viewerRelationMap, ChallengeViewerRelation.None),
  availableActions: challenge.availableActions.map(action =>
    normalizeEnum(action, challengeActionMap, ChallengeAction.Join),
  ),
  participantActions: challenge.participantActions,
  isActionable: challenge.isActionable,
  isParticipating: challenge.isParticipating,
  isHistorical: challenge.isHistorical,
})

const mergeUserChallengeStates = (left: ChallengeUserState, right: ChallengeUserState): ChallengeUserState => {
  const relationPriority: Record<ChallengeUserState["viewerRelation"], number> = {
    [ChallengeViewerRelation.None]: 0,
    [ChallengeViewerRelation.Declined]: 1,
    [ChallengeViewerRelation.Invited]: 2,
    [ChallengeViewerRelation.Joined]: 3,
    [ChallengeViewerRelation.Creator]: 4,
  }

  const participantActions =
    BigInt(left.participantActions || "0") >= BigInt(right.participantActions || "0")
      ? left.participantActions
      : right.participantActions

  return {
    challengeId: left.challengeId,
    createdAt: Math.max(left.createdAt, right.createdAt),
    viewerRelation:
      relationPriority[left.viewerRelation] >= relationPriority[right.viewerRelation]
        ? left.viewerRelation
        : right.viewerRelation,
    availableActions: Array.from(new Set([...left.availableActions, ...right.availableActions])),
    participantActions,
    isActionable: left.isActionable || right.isActionable,
    isParticipating: left.isParticipating || right.isParticipating,
    isHistorical: left.isHistorical || right.isHistorical,
  }
}

const mapRawChallengeBase = (challenge: RawChallengeSummaryResponse | RawChallengeDetailResponse): ChallengeBase => ({
  challengeId: challenge.challengeId,
  createdAt: challenge.createdAt,
  kind: normalizeEnum(challenge.kind, challengeKindMap, ChallengeKind.Stake),
  visibility: normalizeEnum(challenge.visibility, challengeVisibilityMap, ChallengeVisibility.Public),
  challengeType: normalizeEnum(challenge.challengeType, challengeTypeMap, ChallengeType.MaxActions),
  status: normalizeEnum(challenge.lifecycleStatus, challengeStatusMap, ChallengeStatus.Pending),
  phase: normalizeEnum(challenge.phase, challengePhaseMap, ChallengePhase.Upcoming),
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
})

export const mapIndexerChallengeView = (
  challenge: RawChallengeSummaryResponse,
  viewerAddress?: string,
  userState?: ChallengeUserState | null,
): ChallengeView => {
  const base = mapRawChallengeBase(challenge)
  const resolvedState = userState ?? deriveDefaultUserState(base, viewerAddress)
  const viewerRelation = resolvedState?.viewerRelation ?? ChallengeViewerRelation.None
  const viewerStatus = mapViewerRelationToStatus(viewerRelation)
  const canAccept = hasAction(resolvedState, ChallengeAction.AcceptInvite)
  const canDecline = hasAction(resolvedState, ChallengeAction.DeclineInvite)

  return {
    ...base,
    viewerStatus,
    isCreator: viewerRelation === ChallengeViewerRelation.Creator || compareAddresses(base.creator, viewerAddress),
    isJoined: viewerRelation === ChallengeViewerRelation.Joined,
    isInvitationPending:
      base.status === ChallengeStatus.Pending &&
      viewerRelation !== ChallengeViewerRelation.None &&
      viewerRelation !== ChallengeViewerRelation.Creator &&
      viewerRelation !== ChallengeViewerRelation.Joined &&
      (canAccept || canDecline),
    isSplitWinWinner: false,
    canJoin: hasAction(resolvedState, ChallengeAction.Join),
    canLeave: hasAction(resolvedState, ChallengeAction.Leave),
    canAccept,
    canDecline,
    canCancel: hasAction(resolvedState, ChallengeAction.Cancel),
    canAddInvites: hasAction(resolvedState, ChallengeAction.AddInvites),
    canClaim: hasAction(resolvedState, ChallengeAction.Claim),
    canRefund: hasAction(resolvedState, ChallengeAction.Refund),
    canComplete: hasAction(resolvedState, ChallengeAction.Complete),
    canClaimSplitWin: hasAction(resolvedState, ChallengeAction.ClaimSplitWin),
    canClaimCreatorSplitWinRefund: hasAction(resolvedState, ChallengeAction.ClaimCreatorSplitWinRefund),
  }
}

export const mapIndexerChallengeDetail = (
  challenge: RawChallengeDetailResponse,
  viewerAddress?: string,
  userState?: ChallengeUserState | null,
): ChallengeView &
  Pick<RawChallengeDetailResponse, "participants" | "invited" | "declined" | "selectedApps" | "winners"> => {
  const view = mapIndexerChallengeView(challenge, viewerAddress, userState)

  return {
    ...view,
    isSplitWinWinner: !!viewerAddress && challenge.winners.some(winner => compareAddresses(winner, viewerAddress)),
    participants: challenge.participants,
    invited: challenge.invited,
    declined: challenge.declined,
    selectedApps: challenge.selectedApps,
    winners: challenge.winners,
  }
}

const fetchPublicChallengeSection = async (
  phase: ChallengePhase,
  page: number,
): Promise<PaginatedResponse<RawChallengeSummaryResponse>> => {
  const params = new URLSearchParams({
    phase,
    page: String(page),
    size: String(PUBLIC_PAGE_SIZE),
  })

  const response = await indexerFetch(`/api/v1/b3tr/challenges?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${phase} challenges`)
  }

  return (await response.json()) as PaginatedResponse<RawChallengeSummaryResponse>
}

const fetchUserChallengeSection = async (
  type: UserChallengeListType,
  wallet: string,
  page: number,
): Promise<PaginatedResponse<ChallengeUserState>> => {
  const params = new URLSearchParams({
    type,
    page: String(page),
    size: String(USER_PAGE_SIZE[type]),
  })

  const response = await indexerFetch(`/api/v1/b3tr/users/${wallet}/challenges?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${type} challenges`)
  }

  const payload = (await response.json()) as PaginatedResponse<RawUserChallengeStateResponse>
  return {
    data: payload.data.map(normalizeUserChallengeState),
    pagination: payload.pagination,
  }
}

const fetchPublicChallengeDetail = async (challengeId: number): Promise<RawChallengeDetailResponse | null> => {
  const response = await indexerFetch(`/api/v1/b3tr/challenges/${challengeId}`)
  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch challenge ${challengeId}`)
  }

  return (await response.json()) as RawChallengeDetailResponse
}

const fetchUserChallengeStateDetail = async (
  wallet: string,
  challengeId: number,
): Promise<ChallengeUserState | null> => {
  const response = await indexerFetch(`/api/v1/b3tr/users/${wallet}/challenges/${challengeId}`)
  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch challenge state ${challengeId}`)
  }

  return normalizeUserChallengeState((await response.json()) as RawUserChallengeStateResponse)
}

export const getPublicChallengeSectionQueryKey = (phase: ChallengePhase) => ["challenges", "public", "list", phase]

export const getUserChallengeSectionQueryKey = (type: UserChallengeListType, viewerAddress?: string) => [
  "challenges",
  "user-state",
  "list",
  type,
  viewerAddress ?? "guest",
]

export const getPublicChallengeDetailQueryKey = (challengeId: number) => ["challenges", "public", "detail", challengeId]

export const getUserChallengeDetailQueryKey = (challengeId: number, viewerAddress?: string) => [
  "challenges",
  "user-state",
  "detail",
  challengeId,
  viewerAddress ?? "guest",
]

export const usePublicChallengeSection = (phase: ChallengePhase) => {
  return useInfiniteQuery({
    queryKey: getPublicChallengeSectionQueryKey(phase),
    queryFn: ({ pageParam }) => fetchPublicChallengeSection(phase, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      return lastPage.pagination.hasNext ? (lastPageParam as number) + 1 : undefined
    },
  })
}

export const useUserChallengeStateSection = (type: UserChallengeListType, viewerAddress?: string) => {
  return useInfiniteQuery({
    queryKey: getUserChallengeSectionQueryKey(type, viewerAddress),
    queryFn: ({ pageParam }) => fetchUserChallengeSection(type, viewerAddress!, pageParam as number),
    enabled: !!viewerAddress,
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      return lastPage.pagination.hasNext ? (lastPageParam as number) + 1 : undefined
    },
  })
}

export const usePublicChallengeDetails = (challengeIds: number[]) => {
  return useQueries({
    queries: challengeIds.map(challengeId => ({
      queryKey: getPublicChallengeDetailQueryKey(challengeId),
      queryFn: () => fetchPublicChallengeDetail(challengeId),
      enabled: challengeId > 0,
      staleTime: 30_000,
    })),
  })
}

export const usePublicChallengeDetail = (
  challengeId: number,
  options?: {
    enabled?: boolean
    pollWhileMissing?: boolean
  },
) => {
  const { enabled = true, pollWhileMissing = false } = options ?? {}

  return useQuery({
    queryKey: getPublicChallengeDetailQueryKey(challengeId),
    queryFn: () => fetchPublicChallengeDetail(challengeId),
    enabled,
    refetchInterval: query => (pollWhileMissing && query.state.data === null ? 2000 : false),
  })
}

export const useUserChallengeStateDetail = (challengeId: number, viewerAddress?: string, enabled = true) => {
  return useQuery({
    queryKey: getUserChallengeDetailQueryKey(challengeId, viewerAddress),
    queryFn: () => fetchUserChallengeStateDetail(viewerAddress!, challengeId),
    enabled: !!viewerAddress && enabled,
  })
}

export const mergeChallengeStatesById = (states: ChallengeUserState[]): Map<number, ChallengeUserState> => {
  const stateById = new Map<number, ChallengeUserState>()

  for (const state of states) {
    const existing = stateById.get(state.challengeId)
    stateById.set(state.challengeId, existing ? mergeUserChallengeStates(existing, state) : state)
  }

  return stateById
}
