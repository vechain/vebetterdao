export const ChallengeKind = { Stake: 0, Sponsored: 1 } as const
export type ChallengeKind = (typeof ChallengeKind)[keyof typeof ChallengeKind]

export const ChallengeVisibility = { Public: 0, Private: 1 } as const
export type ChallengeVisibility = (typeof ChallengeVisibility)[keyof typeof ChallengeVisibility]

export const ChallengeStatus = {
  Pending: 0,
  Active: 1,
  Finalized: 2,
  Cancelled: 3,
  Invalid: 4,
} as const
export type ChallengeStatus = (typeof ChallengeStatus)[keyof typeof ChallengeStatus]

export const ThresholdMode = { None: 0, SplitAboveThreshold: 1, TopAboveThreshold: 2 } as const
export type ThresholdMode = (typeof ThresholdMode)[keyof typeof ThresholdMode]

export const ParticipantStatus = { None: 0, Invited: 1, Declined: 2, Joined: 3 } as const
export type ParticipantStatus = (typeof ParticipantStatus)[keyof typeof ParticipantStatus]

export const SettlementMode = { None: 0, TopWinners: 1, QualifiedSplit: 2, CreatorRefund: 3 } as const
export type SettlementMode = (typeof SettlementMode)[keyof typeof SettlementMode]

export type ChallengeTab = "all" | "mine" | "invited" | "public"

export interface GroupedChallenges {
  activeParticipating: ChallengeView[]
  pendingInvites: ChallengeView[]
  publicJoinable: ChallengeView[]
  past: ChallengeView[]
}

export interface ChallengeView {
  challengeId: number
  createdAt: number
  kind: ChallengeKind
  visibility: ChallengeVisibility
  thresholdMode: ThresholdMode
  status: ChallengeStatus
  settlementMode: SettlementMode
  creator: string
  stakeAmount: string
  totalPrize: string
  startRound: number
  endRound: number
  duration: number
  threshold: string
  allApps: boolean
  participantCount: number
  maxParticipants: number
  invitedCount: number
  declinedCount: number
  selectedAppsCount: number
  viewerStatus: ParticipantStatus
  isCreator: boolean
  isJoined: boolean
  isInvitationPending: boolean
  canJoin: boolean
  canLeave: boolean
  canAccept: boolean
  canDecline: boolean
  canCancel: boolean
  canAddInvites: boolean
  canClaim: boolean
  canRefund: boolean
  canFinalize: boolean
}

export interface ChallengeDetail extends ChallengeView {
  participants: string[]
  invited: string[]
  declined: string[]
  selectedApps: string[]
}

export type ChallengeKindLabel = "Stake" | "Sponsored"
export type ChallengeVisibilityLabel = "Public" | "Private"
export type ChallengeStatusLabel = "Pending" | "Active" | "Finalized" | "Cancelled" | "Invalid"

export const challengeKindLabel = (kind: ChallengeKind): ChallengeKindLabel =>
  kind === ChallengeKind.Stake ? "Stake" : "Sponsored"

export const challengeVisibilityLabel = (v: ChallengeVisibility): ChallengeVisibilityLabel =>
  v === ChallengeVisibility.Public ? "Public" : "Private"

export const challengeStatusLabel = (s: ChallengeStatus): ChallengeStatusLabel =>
  (["Pending", "Active", "Finalized", "Cancelled", "Invalid"] as const)[s]
