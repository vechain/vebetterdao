import { NextChallengeStatusKind, resolveNextChallengeStatus, selectNextChallengeStatus } from "./nextChallengeStatus"
import {
  ChallengeKind,
  ChallengeStatus,
  ChallengeType,
  ChallengeView,
  ChallengeVisibility,
  ParticipantStatus,
  SettlementMode,
} from "./types"

const challenge = (overrides: Partial<ChallengeView> = {}): ChallengeView => ({
  challengeId: 1,
  createdAt: 1,
  kind: ChallengeKind.Sponsored,
  visibility: ChallengeVisibility.Public,
  challengeType: ChallengeType.SplitWin,
  status: ChallengeStatus.Active,
  settlementMode: SettlementMode.None,
  creator: "0x0000000000000000000000000000000000000001",
  title: "A quest",
  stakeAmount: "0",
  totalPrize: "100",
  startRound: 10,
  endRound: 12,
  duration: 3,
  threshold: "5",
  numWinners: 2,
  winnersClaimed: 0,
  prizePerWinner: "50",
  allApps: true,
  participantCount: 1,
  maxParticipants: 10,
  invitedCount: 0,
  declinedCount: 0,
  selectedAppsCount: 0,
  winnersCount: 0,
  bestCount: 0,
  viewerActions: 2,
  viewerStatus: ParticipantStatus.Joined,
  isCreator: false,
  isJoined: true,
  isInvitationPending: false,
  isSplitWinWinner: false,
  canJoin: false,
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
  isParticipating: true,
  isHistorical: false,
  wasInvited: false,
  ...overrides,
})

describe("nextChallengeStatus", () => {
  it("prioritizes a claim over an invitation and active progress", () => {
    const selected = selectNextChallengeStatus([
      challenge({ challengeId: 1 }),
      challenge({
        challengeId: 2,
        status: ChallengeStatus.Pending,
        viewerStatus: ParticipantStatus.Invited,
        isJoined: false,
        isInvitationPending: true,
        canAccept: true,
        canDecline: true,
        isActionable: true,
      }),
      challenge({ challengeId: 3, canClaimSplitWin: true, isActionable: true }),
    ])

    expect(selected?.challenge.challengeId).toBe(3)
    expect(selected?.kind).toBe(NextChallengeStatusKind.Claim)
  })

  it("reports remaining actions only for Split Win", () => {
    const status = resolveNextChallengeStatus(challenge({ threshold: "7", viewerActions: 3 }))

    expect(status?.kind).toBe(NextChallengeStatusKind.ActiveSplitWin)
    expect(status?.messageValues).toEqual({ missingActions: 4 })
  })

  it("does not imply that a Max Actions score guarantees a win", () => {
    const status = resolveNextChallengeStatus(
      challenge({ challengeType: ChallengeType.MaxActions, threshold: "20", viewerActions: 7 }),
    )

    expect(status?.kind).toBe(NextChallengeStatusKind.ActiveMaxActions)
    expect(status?.messageKey).toBe("You have completed {{count}} actions. Keep going until the Quest ends.")
    expect(status?.messageValues).toEqual({ count: 7 })
  })

  it("surfaces a fully claimed Split Win outcome for a participant who did not win", () => {
    const status = resolveNextChallengeStatus(challenge({ winnersClaimed: 2, numWinners: 2 }))

    expect(status?.kind).toBe(NextChallengeStatusKind.FullyClaimed)
    expect(status?.messageKey).toBe("All slots claimed")
  })

  it("does not surface a fully claimed loss for a winner", () => {
    const status = resolveNextChallengeStatus(
      challenge({ winnersClaimed: 2, numWinners: 2, isSplitWinWinner: true, isParticipating: false }),
    )

    expect(status).toBeNull()
  })

  it("surfaces pending participation as upcoming", () => {
    const status = resolveNextChallengeStatus(challenge({ status: ChallengeStatus.Pending, startRound: 42 }))

    expect(status?.kind).toBe(NextChallengeStatusKind.Upcoming)
    expect(status?.messageKey).toBe("Get ready — the B3MO quest starts soon. Prepare your strategy!")
  })
})
