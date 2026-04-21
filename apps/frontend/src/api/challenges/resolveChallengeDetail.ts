import {
  ChallengeDetail,
  ChallengeKind,
  ChallengeStatus,
  ChallengeType,
  ChallengeVisibility,
  ParticipantStatus,
  SettlementMode,
} from "./types"

export type ChallengeDetailResolverInput = {
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
  invitedCount: number
  declinedCount: number
  selectedAppsCount: number
  winnersCount: number
  bestScore: string
  bestCount: number
  payoutsClaimed: number
  participants: string[]
  invited: string[]
  declined: string[]
  selectedApps: string[]
  winners: string[]
  viewerStatus: ParticipantStatus
  isInvitationEligible: boolean
  isSplitWinWinner: boolean
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

/**
 * Whether the viewer's live action count is needed to compute claim eligibility.
 * Max Actions: needed once Completed (to compare against bestScore).
 * Split Win: needed while Active so the user can see whether they meet the threshold.
 */
export const needsChallengeParticipantActions = (
  challenge: Pick<ChallengeDetailResolverInput, "challengeType" | "settlementMode" | "status" | "viewerStatus">,
  hasClaimed: boolean,
) => {
  if (challenge.viewerStatus !== ParticipantStatus.Joined) return false

  if (challenge.challengeType === ChallengeType.SplitWin) {
    return challenge.status === ChallengeStatus.Active && !hasClaimed
  }

  return (
    challenge.status === ChallengeStatus.Completed &&
    !hasClaimed &&
    challenge.settlementMode !== SettlementMode.CreatorRefund
  )
}

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
  const isSplitWin = challenge.challengeType === ChallengeType.SplitWin
  // Split Win challenges have no participant cap by design.
  const hasReachedParticipantLimit = !isSplitWin && challenge.participantCount >= maxParticipants
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
  const slotsLeft = challenge.numWinners - challenge.winnersClaimed
  const inSplitWinWindow = currentRound >= challenge.startRound && currentRound <= challenge.endRound

  // Max Actions: claim after Completed against bestScore. Split Win: claim during Active window.
  const canClaim =
    !isSplitWin &&
    !hasClaimed &&
    challenge.status === ChallengeStatus.Completed &&
    (challenge.settlementMode === SettlementMode.CreatorRefund
      ? isCreator
      : isJoined && participantActions === bestScore)

  const canClaimSplitWin =
    isSplitWin &&
    !challenge.isSplitWinWinner &&
    challenge.status === ChallengeStatus.Active &&
    isJoined &&
    inSplitWinWindow &&
    slotsLeft > 0 &&
    participantActions >= threshold

  const canClaimCreatorSplitWinRefund =
    isSplitWin &&
    isCreator &&
    !hasRefunded &&
    currentRound > challenge.endRound &&
    slotsLeft > 0 &&
    (challenge.status === ChallengeStatus.Active || challenge.status === ChallengeStatus.Completed)

  const canRefund =
    !hasRefunded &&
    (challenge.status === ChallengeStatus.Cancelled || challenge.status === ChallengeStatus.Invalid) &&
    (challenge.kind === ChallengeKind.Stake ? isJoined : isCreator)

  // Only Max Actions challenges require an explicit completion call after endRound.
  const isAwaitingCompletion =
    !isSplitWin && challenge.status === ChallengeStatus.Active && challenge.endRound < currentRound
  const canComplete = isAwaitingCompletion && (isCreator || isJoined)

  return {
    challengeId: challenge.challengeId,
    createdAt: challenge.createdAt,
    kind: challenge.kind,
    visibility: challenge.visibility,
    challengeType: challenge.challengeType,
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
    numWinners: challenge.numWinners,
    winnersClaimed: challenge.winnersClaimed,
    prizePerWinner: challenge.prizePerWinner,
    allApps: challenge.allApps,
    participantCount: challenge.participantCount,
    maxParticipants,
    invitedCount: challenge.invitedCount,
    declinedCount: challenge.declinedCount,
    selectedAppsCount: challenge.selectedAppsCount,
    winnersCount: challenge.winnersCount,
    viewerStatus: challenge.viewerStatus,
    isCreator,
    isJoined,
    isInvitationPending,
    isSplitWinWinner: challenge.isSplitWinWinner,
    canJoin,
    canLeave,
    canAccept,
    canDecline,
    canCancel,
    canAddInvites,
    canClaim,
    canClaimSplitWin,
    canClaimCreatorSplitWinRefund,
    canRefund,
    canComplete,
    participants: challenge.participants,
    invited: challenge.invited,
    declined: challenge.declined,
    selectedApps: challenge.selectedApps,
    winners: challenge.winners,
  }
}
