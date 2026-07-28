import { isEndedPublicChallenge, selectEndedChallenges } from "./endedChallenges"
import {
  ChallengeKind,
  ChallengeStatus,
  ChallengeType,
  ChallengeView,
  ChallengeVisibility,
  ParticipantStatus,
  SettlementMode,
} from "./types"

const CURRENT_ROUND = 20

const challenge = (overrides: Partial<ChallengeView> = {}): ChallengeView => ({
  challengeId: 1,
  createdAt: 0,
  kind: ChallengeKind.Sponsored,
  visibility: ChallengeVisibility.Public,
  challengeType: ChallengeType.SplitWin,
  status: ChallengeStatus.Completed,
  settlementMode: SettlementMode.SplitWinCompleted,
  creator: "0x0000000000000000000000000000000000000001",
  stakeAmount: "0",
  totalPrize: "100",
  startRound: 10,
  endRound: 12,
  duration: 3,
  threshold: "5",
  numWinners: 2,
  winnersClaimed: 2,
  prizePerWinner: "50",
  allApps: true,
  participantCount: 4,
  maxParticipants: 10,
  invitedCount: 0,
  declinedCount: 0,
  selectedAppsCount: 0,
  winnersCount: 2,
  bestCount: 0,
  viewerActions: 0,
  viewerStatus: ParticipantStatus.None,
  isCreator: false,
  isJoined: false,
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
  isParticipating: false,
  isHistorical: false,
  wasInvited: false,
  ...overrides,
})

describe("isEndedPublicChallenge", () => {
  it("keeps settled public quests", () => {
    expect(isEndedPublicChallenge(challenge(), CURRENT_ROUND)).toBe(true)
  })

  it("keeps public quests whose window closed without settlement", () => {
    expect(isEndedPublicChallenge(challenge({ status: ChallengeStatus.Active, endRound: 19 }), CURRENT_ROUND)).toBe(
      true,
    )
  })

  it("drops public quests still inside their window", () => {
    expect(isEndedPublicChallenge(challenge({ status: ChallengeStatus.Active, endRound: 20 }), CURRENT_ROUND)).toBe(
      false,
    )
    expect(isEndedPublicChallenge(challenge({ status: ChallengeStatus.Pending, endRound: 30 }), CURRENT_ROUND)).toBe(
      false,
    )
  })

  it("drops quests that never ran", () => {
    expect(isEndedPublicChallenge(challenge({ status: ChallengeStatus.Cancelled }), CURRENT_ROUND)).toBe(false)
    expect(isEndedPublicChallenge(challenge({ status: ChallengeStatus.Invalid }), CURRENT_ROUND)).toBe(false)
  })

  it("drops private quests", () => {
    expect(isEndedPublicChallenge(challenge({ visibility: ChallengeVisibility.Private }), CURRENT_ROUND)).toBe(false)
  })
})

describe("selectEndedChallenges", () => {
  it("returns only ended public quests, newest first", () => {
    const selected = selectEndedChallenges(
      [
        challenge({ challengeId: 1 }),
        challenge({ challengeId: 2, status: ChallengeStatus.Active, endRound: 19 }),
        challenge({ challengeId: 3, status: ChallengeStatus.Active, endRound: 25 }),
        challenge({ challengeId: 4, status: ChallengeStatus.Cancelled }),
        challenge({ challengeId: 5, visibility: ChallengeVisibility.Private }),
        challenge({ challengeId: 6 }),
      ],
      CURRENT_ROUND,
    )

    expect(selected.map(c => c.challengeId)).toEqual([6, 2, 1])
  })

  it("does not mutate the input", () => {
    const all = [challenge({ challengeId: 1 }), challenge({ challengeId: 2 })]

    selectEndedChallenges(all, CURRENT_ROUND)

    expect(all.map(c => c.challengeId)).toEqual([1, 2])
  })
})
