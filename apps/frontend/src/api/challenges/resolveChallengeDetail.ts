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
  maxParticipants: number
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
  eligibleInvitees: string[]
  claimedBy: string[]
  refundedBy: string[]
  creatorRefunded: boolean
}

type ResolveChallengeDetailParams = {
  challenge: ChallengeDetailResolverInput
  viewerAddress?: string
  currentRound: number
  participantActions?: bigint
}

const compareAddresses = (left?: string, right?: string) =>
  !!left && !!right && left.toLowerCase() === right.toLowerCase()

const includesAddress = (addresses: string[], viewerAddress?: string) =>
  !!viewerAddress && addresses.some(address => compareAddresses(address, viewerAddress))

const resolveViewerStatus = (
  {
    participants,
    invited,
    declined,
  }: Pick<ChallengeDetailResolverInput, "creator" | "participants" | "invited" | "declined">,
  viewerAddress?: string,
) => {
  // Stake-kind creators auto-join on-chain (they front the stake), so they show up in the
  // participants list. Defer entirely to that list so `isJoined` reflects on-chain truth and
  // refund/claim flags work for creator-participants. `isCreator` is tracked separately.
  if (includesAddress(participants, viewerAddress)) return ParticipantStatus.Joined
  if (includesAddress(invited, viewerAddress)) return ParticipantStatus.Invited
  if (includesAddress(declined, viewerAddress)) return ParticipantStatus.Declined
  return ParticipantStatus.None
}

/**
 * Whether the viewer's live action count is needed to compute claim eligibility.
 * Max Actions: needed once Completed (to compare against bestScore).
 * Split Win: needed while Active so the user can see whether they meet the threshold.
 */
export const needsChallengeParticipantActions = (
  challenge: Pick<
    ChallengeDetailResolverInput,
    "challengeType" | "settlementMode" | "status" | "creator" | "participants" | "invited" | "declined" | "claimedBy"
  >,
  viewerAddress?: string,
) => {
  const viewerStatus = resolveViewerStatus(challenge, viewerAddress)
  if (viewerStatus !== ParticipantStatus.Joined) return false
  const hasClaimed = includesAddress(challenge.claimedBy, viewerAddress)

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
  participantActions = 0n,
}: ResolveChallengeDetailParams): ChallengeDetail => {
  const isCreator = compareAddresses(challenge.creator, viewerAddress)
  const viewerStatus = resolveViewerStatus(challenge, viewerAddress)
  const isJoined = viewerStatus === ParticipantStatus.Joined
  const isInvitationEligible = includesAddress(challenge.eligibleInvitees, viewerAddress)
  const isInvited = viewerStatus === ParticipantStatus.Invited || isInvitationEligible
  const isInvitationPending = challenge.status === ChallengeStatus.Pending && isInvited && !isJoined
  const isSplitWin = challenge.challengeType === ChallengeType.SplitWin
  const hasClaimed = includesAddress(challenge.claimedBy, viewerAddress)
  const hasRefunded = includesAddress(challenge.refundedBy, viewerAddress)
  // MaxActions challenges with TopWinners settlement also populate `winners`,
  // so gate this strictly on Split Win to avoid mislabelling MaxActions top-winners.
  const isSplitWinWinner = isSplitWin && includesAddress(challenge.winners, viewerAddress)
  // Split Win challenges have no participant cap by design.
  const hasReachedParticipantLimit = !isSplitWin && challenge.participantCount >= challenge.maxParticipants
  const canJoin =
    challenge.status === ChallengeStatus.Pending &&
    challenge.visibility === ChallengeVisibility.Public &&
    !isJoined &&
    !isCreator &&
    !hasReachedParticipantLimit
  const canAccept = isInvitationPending && !hasReachedParticipantLimit
  const canDecline = isInvitationPending && viewerStatus !== ParticipantStatus.Declined
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
    !isSplitWinWinner &&
    challenge.status === ChallengeStatus.Active &&
    isJoined &&
    inSplitWinWindow &&
    slotsLeft > 0 &&
    participantActions >= threshold

  const canClaimCreatorSplitWinRefund =
    isSplitWin &&
    isCreator &&
    !challenge.creatorRefunded &&
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
  const needsPastAction = canClaim || canRefund || canComplete || canClaimSplitWin || canClaimCreatorSplitWinRefund
  const isLive = challenge.status === ChallengeStatus.Pending || challenge.status === ChallengeStatus.Active
  const isDone =
    challenge.status === ChallengeStatus.Completed ||
    challenge.status === ChallengeStatus.Cancelled ||
    challenge.status === ChallengeStatus.Invalid
  const isParticipating = isLive && !isAwaitingCompletion && (isCreator || isJoined)
  const isActionable = needsPastAction || ((canAccept || canDecline) && viewerStatus !== ParticipantStatus.Declined)
  const isHistorical =
    (viewerStatus === ParticipantStatus.Declined && canAccept) ||
    (isDone && (isCreator || isJoined) && !needsPastAction)

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
    maxParticipants: challenge.maxParticipants,
    invitedCount: challenge.invitedCount,
    declinedCount: challenge.declinedCount,
    selectedAppsCount: challenge.selectedAppsCount,
    winnersCount: challenge.winnersCount,
    bestCount: challenge.bestCount,
    viewerStatus,
    isCreator,
    isJoined,
    isInvitationPending,
    isSplitWinWinner,
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
    isActionable,
    isParticipating,
    isHistorical,
    wasInvited: isInvitationEligible,
    viewerActions: Number(participantActions),
  }
}
