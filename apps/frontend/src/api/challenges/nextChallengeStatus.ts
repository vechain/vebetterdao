import { ChallengeStatus, ChallengeType, ChallengeView } from "./types"

export const NextChallengeStatusKind = {
  Claim: "claim",
  Refund: "refund",
  Finalize: "finalize",
  Invitation: "invitation",
  Action: "action",
  ActiveSplitWin: "activeSplitWin",
  ActiveMaxActions: "activeMaxActions",
  Active: "active",
  Upcoming: "upcoming",
  FullyClaimed: "fullyClaimed",
} as const

export type NextChallengeStatusKind = (typeof NextChallengeStatusKind)[keyof typeof NextChallengeStatusKind]

export interface NextChallengeStatus {
  challenge: ChallengeView
  kind: NextChallengeStatusKind
  priority: number
  messageKey: string
  messageValues?: Record<string, number>
}

const isRelevantFullyClaimedOutcome = (challenge: ChallengeView) =>
  challenge.challengeType === ChallengeType.SplitWin &&
  challenge.isJoined &&
  !challenge.isSplitWinWinner &&
  challenge.numWinners > 0 &&
  challenge.winnersClaimed >= challenge.numWinners

/**
 * Turns a wallet-aware challenge view into the single status worth surfacing.
 * Lower priorities are more urgent. Presentation copy stays as translation keys
 * so this domain helper is reusable outside the homepage.
 */
export const resolveNextChallengeStatus = (challenge: ChallengeView): NextChallengeStatus | null => {
  if (challenge.canClaim || challenge.canClaimSplitWin) {
    return { challenge, kind: NextChallengeStatusKind.Claim, priority: 0, messageKey: "Claim prize" }
  }

  if (challenge.canRefund || challenge.canClaimCreatorSplitWinRefund) {
    return { challenge, kind: NextChallengeStatusKind.Refund, priority: 1, messageKey: "Claim refund" }
  }

  if (challenge.canComplete) {
    return { challenge, kind: NextChallengeStatusKind.Finalize, priority: 2, messageKey: "Finalize" }
  }

  if (challenge.isInvitationPending && (challenge.canAccept || challenge.canDecline)) {
    return { challenge, kind: NextChallengeStatusKind.Invitation, priority: 4, messageKey: "Pending invitation" }
  }

  if (challenge.isActionable) {
    return { challenge, kind: NextChallengeStatusKind.Action, priority: 3, messageKey: "Action needed" }
  }

  if (isRelevantFullyClaimedOutcome(challenge)) {
    return { challenge, kind: NextChallengeStatusKind.FullyClaimed, priority: 8, messageKey: "All slots claimed" }
  }

  if (challenge.status === ChallengeStatus.Active && (challenge.isJoined || challenge.isCreator)) {
    if (challenge.challengeType === ChallengeType.SplitWin && challenge.isJoined && !challenge.isSplitWinWinner) {
      const remainingActions = Math.max(Number(challenge.threshold) - challenge.viewerActions, 0)
      return {
        challenge,
        kind: NextChallengeStatusKind.ActiveSplitWin,
        priority: 5,
        messageKey: "You need {{missingActions}} more actions",
        messageValues: { missingActions: remainingActions },
      }
    }

    // Winners have completed their Split Win journey; don't keep prompting them
    // merely because the on-chain challenge remains Active for other slots.
    if (challenge.challengeType === ChallengeType.SplitWin && challenge.isSplitWinWinner) return null

    if (challenge.challengeType === ChallengeType.MaxActions && challenge.isJoined) {
      return {
        challenge,
        kind: NextChallengeStatusKind.ActiveMaxActions,
        priority: 5,
        messageKey: "You have completed {{count}} actions. Keep going until the Quest ends.",
        messageValues: { count: challenge.viewerActions },
      }
    }

    return { challenge, kind: NextChallengeStatusKind.Active, priority: 5, messageKey: "Active" }
  }

  if (challenge.status === ChallengeStatus.Pending && (challenge.isJoined || challenge.isCreator)) {
    return {
      challenge,
      kind: NextChallengeStatusKind.Upcoming,
      priority: 6,
      messageKey: "Get ready — the B3MO quest starts soon. Prepare your strategy!",
    }
  }

  return null
}

/** Selects one next move while preserving the source order for equal priorities. */
export const selectNextChallengeStatus = (challenges: ChallengeView[]): NextChallengeStatus | null => {
  let selected: NextChallengeStatus | null = null

  for (const challenge of challenges) {
    const candidate = resolveNextChallengeStatus(challenge)
    if (candidate && (!selected || candidate.priority < selected.priority)) selected = candidate
  }

  return selected
}
