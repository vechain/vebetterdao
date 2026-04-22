import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { useCurrentAllocationsRoundId } from "../contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { indexerFetch } from "../indexer/api"

import { needsChallengeParticipantActions, resolveChallengeDetail } from "./resolveChallengeDetail"
import {
  ChallengeDetail,
  ChallengeKind,
  ChallengePhase,
  ChallengeStatus,
  ChallengeType,
  ChallengeView,
  ChallengeVisibility,
  ParticipantStatus,
  SettlementMode,
  WalletChallengeRef,
} from "./types"
import {
  getChallengeParticipantActionRequestKey,
  useChallengeParticipantActionsBatch,
  type ChallengeParticipantActionRequest,
} from "./useChallengeParticipantActions"

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
  bestCount?: number
}

export interface RawChallengeDetailResponse extends RawChallengeSummaryResponse {
  bestScore: string
  bestCount: number
  payoutsClaimed: number
  participants: string[]
  invited: string[]
  declined: string[]
  selectedApps: string[]
  winners: string[]
  eligibleInvitees: string[]
  claimedBy: string[]
  refundedBy: string[]
  creatorRefunded: boolean
}

type RawWalletChallengeRefResponse = WalletChallengeRef

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
  bestCount: number
}

const PUBLIC_PAGE_SIZE = 12
const WALLET_PAGE_SIZE = 30

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

const normalizeEnum = <T extends number | string>(value: string | number, map: Record<string, T>, fallback: T): T => {
  if (typeof value === "number") return value as T
  return map[value] ?? fallback
}

const compareAddresses = (left?: string, right?: string) =>
  !!left && !!right && left.toLowerCase() === right.toLowerCase()

const isSplitWinChallenge = (challenge: Pick<ChallengeBase, "challengeType">) =>
  challenge.challengeType === ChallengeType.SplitWin

const hasReachedParticipantLimit = (
  challenge: Pick<ChallengeBase, "challengeType" | "participantCount" | "maxParticipants">,
) => !isSplitWinChallenge(challenge) && challenge.participantCount >= challenge.maxParticipants

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
  bestCount: challenge.bestCount ?? 0,
})

export const mapRawChallengeDetail = (challenge: RawChallengeDetailResponse) => ({
  ...mapRawChallengeBase(challenge),
  bestScore: challenge.bestScore,
  bestCount: challenge.bestCount,
  payoutsClaimed: challenge.payoutsClaimed,
  participants: challenge.participants,
  invited: challenge.invited,
  declined: challenge.declined,
  selectedApps: challenge.selectedApps,
  winners: challenge.winners,
  eligibleInvitees: challenge.eligibleInvitees,
  claimedBy: challenge.claimedBy,
  refundedBy: challenge.refundedBy,
  creatorRefunded: challenge.creatorRefunded,
})

export const mapIndexerChallengeView = (
  challenge: RawChallengeSummaryResponse,
  viewerAddress?: string,
): ChallengeView => {
  const base = mapRawChallengeBase(challenge)
  const isCreator = compareAddresses(base.creator, viewerAddress)
  const canJoin =
    !!viewerAddress &&
    base.status === ChallengeStatus.Pending &&
    base.visibility === ChallengeVisibility.Public &&
    !isCreator &&
    !hasReachedParticipantLimit(base)

  return {
    ...base,
    viewerStatus: ParticipantStatus.None,
    isCreator,
    isJoined: false,
    isInvitationPending: false,
    isSplitWinWinner: false,
    canJoin,
    canLeave: false,
    canAccept: false,
    canDecline: false,
    canCancel: false,
    canAddInvites: false,
    canClaim: false,
    canRefund: false,
    canComplete: false,
    canClaimSplitWin: false,
    canClaimCreatorSplitWinRefund: false,
    isActionable: false,
    isParticipating: false,
    isHistorical: false,
  }
}

export const mapIndexerChallengeDetail = (
  challenge: RawChallengeDetailResponse,
  viewerAddress?: string,
  options?: {
    currentRound?: number
    participantActions?: bigint
  },
): ChallengeDetail => {
  const { currentRound = 0, participantActions = 0n } = options ?? {}
  return resolveChallengeDetail({
    challenge: mapRawChallengeDetail(challenge),
    viewerAddress,
    currentRound,
    participantActions,
  })
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

const fetchWalletChallengeRefs = async (
  wallet: string,
  page: number,
): Promise<PaginatedResponse<WalletChallengeRef>> => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(WALLET_PAGE_SIZE),
  })

  const response = await indexerFetch(`/api/v1/b3tr/users/${wallet}/challenges?${params.toString()}`)
  if (!response.ok) {
    throw new Error("Failed to fetch wallet challenges")
  }

  const payload = (await response.json()) as PaginatedResponse<RawWalletChallengeRefResponse>
  return {
    data: payload.data,
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

export const getPublicChallengeSectionQueryKey = (phase: ChallengePhase) => ["challenges", "public", "list", phase]

export const getWalletChallengeRefsQueryKey = (viewerAddress?: string) => [
  "challenges",
  "wallet-ref",
  "list",
  viewerAddress ?? "guest",
]

export const getPublicChallengeDetailQueryKey = (challengeId: number) => ["challenges", "public", "detail", challengeId]

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

export const useWalletChallengeRefs = (viewerAddress?: string) => {
  return useInfiniteQuery({
    queryKey: getWalletChallengeRefsQueryKey(viewerAddress),
    queryFn: ({ pageParam }) => fetchWalletChallengeRefs(viewerAddress!, pageParam as number),
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

export const useWalletChallenges = (viewerAddress?: string) => {
  const refsQuery = useWalletChallengeRefs(viewerAddress)
  const currentRoundQuery = useCurrentAllocationsRoundId()

  const refs = useMemo(() => refsQuery.data?.pages.flatMap(page => page.data) ?? [], [refsQuery.data])
  const challengeIds = useMemo(() => refs.map(ref => ref.challengeId), [refs])
  const detailQueries = usePublicChallengeDetails(challengeIds)

  const detailById = useMemo(() => {
    const mapped = new Map<number, RawChallengeDetailResponse>()

    detailQueries.forEach((query, index) => {
      if (!query.data) return
      const challengeId = challengeIds[index]
      if (challengeId === undefined) return
      mapped.set(challengeId, query.data)
    })

    return mapped
  }, [challengeIds, detailQueries])

  const participantActionRequests = useMemo<ChallengeParticipantActionRequest[]>(() => {
    if (!viewerAddress) return []

    return refs.flatMap(ref => {
      const challenge = detailById.get(ref.challengeId)
      if (!challenge) return []
      return needsChallengeParticipantActions(mapRawChallengeDetail(challenge), viewerAddress)
        ? [{ challengeId: ref.challengeId, participant: viewerAddress }]
        : []
    })
  }, [detailById, refs, viewerAddress])

  const participantActionsQuery = useChallengeParticipantActionsBatch(participantActionRequests)
  const participantActionsByKey = participantActionsQuery.data ?? {}

  const items = useMemo<ChallengeDetail[]>(() => {
    if (!viewerAddress || currentRoundQuery.data === undefined) return []

    const currentRound = Number(currentRoundQuery.data ?? 0)

    return refs
      .map(ref => {
        const challenge = detailById.get(ref.challengeId)
        if (!challenge) return null

        const key = getChallengeParticipantActionRequestKey({
          challengeId: ref.challengeId,
          participant: viewerAddress,
        })
        const participantActions = BigInt(participantActionsByKey[key] ?? "0")

        return mapIndexerChallengeDetail(challenge, viewerAddress, {
          currentRound,
          participantActions,
        })
      })
      .filter((item): item is ChallengeDetail => item !== null)
  }, [currentRoundQuery.data, detailById, participantActionsByKey, refs, viewerAddress])

  const detailError = detailQueries.find(query => query.error)?.error ?? null

  return {
    refs,
    items,
    hasNextPage: !!refsQuery.hasNextPage,
    fetchNextPage: refsQuery.fetchNextPage,
    isLoading:
      !!viewerAddress &&
      (refsQuery.isLoading ||
        currentRoundQuery.isLoading ||
        detailQueries.some(query => query.isLoading) ||
        participantActionsQuery.isLoading),
    isFetchingNextPage:
      refsQuery.isFetchingNextPage ||
      detailQueries.some(query => query.isFetching) ||
      participantActionsQuery.isFetching,
    isError:
      refsQuery.isError ||
      currentRoundQuery.isError ||
      detailQueries.some(query => query.isError) ||
      participantActionsQuery.isError,
    error: refsQuery.error ?? currentRoundQuery.error ?? detailError ?? participantActionsQuery.error ?? null,
  }
}
