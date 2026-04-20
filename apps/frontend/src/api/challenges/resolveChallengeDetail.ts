import {
  ChallengeDetail,
  ChallengeKind,
  ChallengeStatus,
  ChallengeVisibility,
  ParticipantStatus,
  SettlementMode,
  ThresholdMode,
} from "./types"

export type ChallengeDetailResolverInput = {
  challengeId: number
  createdAt: number
  kind: ChallengeKind
  visibility: ChallengeVisibility
  thresholdMode: ThresholdMode
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
  allApps: boolean
  participantCount: number
  invitedCount: number
  declinedCount: number
  selectedAppsCount: number
  bestScore: string
  bestCount: number
  qualifiedCount: number
  payoutsClaimed: number
  participants: string[]
  invited: string[]
  declined: string[]
  selectedApps: string[]
  viewerStatus: ParticipantStatus
  isInvitationEligible: boolean
}

type ResolveChallengeDetailParams = {
  challenge: ChallengeDetailResolverInput
  viewerAddress?: string
  currentRound: number
  maxParticipants: number
  hasClaimed: boolean
  hasRefunded: boolean
  participantActions?: bigint
}

const compareAddresses = (left?: string, right?: string) =>
  !!left && !!right && left.toLowerCase() === right.toLowerCase()

export const needsChallengeParticipantActions = (
  challenge: Pick<ChallengeDetailResolverInput, "settlementMode" | "status" | "viewerStatus">,
  hasClaimed: boolean,
) =>
  challenge.status === ChallengeStatus.Finalized &&
  !hasClaimed &&
  challenge.viewerStatus === ParticipantStatus.Joined &&
  challenge.settlementMode !== SettlementMode.CreatorRefund

export const resolveChallengeDetail = ({
  challenge,
  viewerAddress,
  currentRound,
  maxParticipants,
  hasClaimed,
  hasRefunded,
  participantActions = 0n,
}: ResolveChallengeDetailParams): ChallengeDetail => {
  const isCreator = compareAddresses(challenge.creator, viewerAddress)
  const isJoined = challenge.viewerStatus === ParticipantStatus.Joined
  const isInvited = challenge.viewerStatus === ParticipantStatus.Invited || challenge.isInvitationEligible
  const isInvitationPending = challenge.status === ChallengeStatus.Pending && isInvited && !isJoined
  const hasReachedParticipantLimit = challenge.participantCount >= maxParticipants
  const canJoin =
    challenge.status === ChallengeStatus.Pending &&
    challenge.visibility === ChallengeVisibility.Public &&
    !isJoined &&
    !isCreator &&
    !hasReachedParticipantLimit
  const canAccept = isInvitationPending && !hasReachedParticipantLimit
  const canDecline = isInvitationPending && challenge.viewerStatus !== ParticipantStatus.Declined
  const canLeave = challenge.status === ChallengeStatus.Pending && isJoined && !isCreator
  const canCancel = challenge.status === ChallengeStatus.Pending && isCreator
  const canAddInvites =
    challenge.status === ChallengeStatus.Pending &&
    challenge.visibility === ChallengeVisibility.Private &&
    isCreator &&
    currentRound < challenge.startRound

  const threshold = BigInt(challenge.threshold)
  const bestScore = BigInt(challenge.bestScore)
  const canClaim =
    !hasClaimed &&
    challenge.status === ChallengeStatus.Finalized &&
    (challenge.settlementMode === SettlementMode.CreatorRefund
      ? isCreator
      : challenge.settlementMode === SettlementMode.QualifiedSplit
        ? isJoined && participantActions >= threshold
        : isJoined && participantActions === bestScore)

  const canRefund =
    !hasRefunded &&
    (challenge.status === ChallengeStatus.Cancelled || challenge.status === ChallengeStatus.Invalid) &&
    (challenge.kind === ChallengeKind.Stake ? isJoined : isCreator)

  const isAwaitingFinalization = challenge.status === ChallengeStatus.Active && challenge.endRound < currentRound
  const canFinalize = isAwaitingFinalization && (isCreator || isJoined)

  return {
    challengeId: challenge.challengeId,
    createdAt: challenge.createdAt,
    kind: challenge.kind,
    visibility: challenge.visibility,
    thresholdMode: challenge.thresholdMode,
    status: challenge.status,
    settlementMode: challenge.settlementMode,
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
    allApps: challenge.allApps,
    participantCount: challenge.participantCount,
    maxParticipants,
    invitedCount: challenge.invitedCount,
    declinedCount: challenge.declinedCount,
    selectedAppsCount: challenge.selectedAppsCount,
    viewerStatus: challenge.viewerStatus,
    isCreator,
    isJoined,
    isInvitationPending,
    canJoin,
    canLeave,
    canAccept,
    canDecline,
    canCancel,
    canAddInvites,
    canClaim,
    canRefund,
    canFinalize,
    participants: challenge.participants,
    invited: challenge.invited,
    declined: challenge.declined,
    selectedApps: challenge.selectedApps,
  }
}
