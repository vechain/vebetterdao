export const ChallengeKind = { Stake: 0, Sponsored: 1 } as const
export type ChallengeKind = (typeof ChallengeKind)[keyof typeof ChallengeKind]

export const ChallengeVisibility = { Public: 0, Private: 1 } as const
export type ChallengeVisibility = (typeof ChallengeVisibility)[keyof typeof ChallengeVisibility]

export const ChallengeStatus = {
  Pending: 0,
  Active: 1,
  Completed: 2,
  Cancelled: 3,
  Invalid: 4,
} as const
export type ChallengeStatus = (typeof ChallengeStatus)[keyof typeof ChallengeStatus]

export const ChallengeType = { MaxActions: 0, SplitWin: 1 } as const
export type ChallengeType = (typeof ChallengeType)[keyof typeof ChallengeType]

export const ParticipantStatus = { None: 0, Invited: 1, Declined: 2, Joined: 3 } as const
export type ParticipantStatus = (typeof ParticipantStatus)[keyof typeof ParticipantStatus]

export const SettlementMode = {
  None: 0,
  TopWinners: 1,
  CreatorRefund: 2,
  SplitWinCompleted: 3,
} as const
export type SettlementMode = (typeof SettlementMode)[keyof typeof SettlementMode]

export const ChallengeViewerRelation = {
  Creator: "Creator",
  Joined: "Joined",
  Invited: "Invited",
  Declined: "Declined",
  None: "None",
} as const
export type ChallengeViewerRelation = (typeof ChallengeViewerRelation)[keyof typeof ChallengeViewerRelation]

export const ChallengeAction = {
  Join: "Join",
  Leave: "Leave",
  AcceptInvite: "AcceptInvite",
  DeclineInvite: "DeclineInvite",
  Cancel: "Cancel",
  AddInvites: "AddInvites",
  Claim: "Claim",
  Refund: "Refund",
  Complete: "Complete",
  ClaimSplitWin: "ClaimSplitWin",
  ClaimCreatorSplitWinRefund: "ClaimCreatorSplitWinRefund",
} as const
export type ChallengeAction = (typeof ChallengeAction)[keyof typeof ChallengeAction]

export const challengeMetadataByteLimits = {
  title: 120,
  description: 500,
  imageURI: 512,
  metadataURI: 512,
} as const

export type ChallengeMetadataField = keyof typeof challengeMetadataByteLimits

export const getChallengeMetadataByteLength = (value: string) => new TextEncoder().encode(value).length

export const getChallengeMetadataLengthError = (metadata: Record<ChallengeMetadataField, string>) => {
  for (const field of Object.keys(challengeMetadataByteLimits) as ChallengeMetadataField[]) {
    const length = getChallengeMetadataByteLength(metadata[field])
    const max = challengeMetadataByteLimits[field]
    if (length > max) return { field, length, max }
  }

  return null
}

export interface ChallengeView {
  challengeId: number
  createdAt: number
  kind: ChallengeKind
  visibility: ChallengeVisibility
  challengeType: ChallengeType
  status: ChallengeStatus
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
  viewerStatus: ParticipantStatus
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
  isActionable: boolean
  isParticipating: boolean
  isHistorical: boolean
  wasInvited: boolean
}

export interface ChallengeDetail extends ChallengeView {
  participants: string[]
  invited: string[]
  declined: string[]
  selectedApps: string[]
  winners: string[]
  viewerActions: number
}

export interface PaginatedChallengeSection {
  items: ChallengeView[]
  hasNextPage: boolean
  isLoading: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => Promise<unknown>
}

export type ChallengeKindLabel = "Stake" | "Sponsored"
export type ChallengeVisibilityLabel = "Public" | "Private"
export type ChallengeTypeLabel = "Max actions" | "Split win"
export type ChallengeStatusLabel = "Pending" | "Active" | "Completed" | "Cancelled" | "Invalid"

export const challengeKindLabel = (kind: ChallengeKind): ChallengeKindLabel =>
  kind === ChallengeKind.Stake ? "Stake" : "Sponsored"

export const challengeVisibilityLabel = (v: ChallengeVisibility): ChallengeVisibilityLabel =>
  v === ChallengeVisibility.Public ? "Public" : "Private"

export const challengeTypeLabel = (t: ChallengeType): ChallengeTypeLabel =>
  t === ChallengeType.SplitWin ? "Split win" : "Max actions"

export const challengeStatusLabel = (s: ChallengeStatus): ChallengeStatusLabel =>
  (["Pending", "Active", "Completed", "Cancelled", "Invalid"] as const)[s]
