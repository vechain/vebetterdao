import { groupChallenges } from "./getChallenges"
import { ChallengeKind, ChallengeStatus, ChallengeView, ChallengeVisibility, ParticipantStatus } from "./types"

const base: ChallengeView = {
  challengeId: 1,
  createdAt: 1000,
  kind: ChallengeKind.Stake,
  visibility: ChallengeVisibility.Public,
  thresholdMode: 0,
  status: ChallengeStatus.Pending,
  settlementMode: 0,
  creator: "0x1",
  stakeAmount: "100",
  totalPrize: "200",
  startRound: 2,
  endRound: 3,
  duration: 2,
  threshold: "0",
  allApps: true,
  participantCount: 2,
  maxParticipants: 10,
  invitedCount: 0,
  declinedCount: 0,
  selectedAppsCount: 0,
  viewerStatus: ParticipantStatus.None,
  isCreator: false,
  isJoined: false,
  isInvitationPending: false,
  canJoin: false,
  canLeave: false,
  canAccept: false,
  canDecline: false,
  canCancel: false,
  canAddInvites: false,
  canClaim: false,
  canRefund: false,
  canFinalize: false,
}

const make = (overrides: Partial<ChallengeView>): ChallengeView => ({ ...base, ...overrides })

describe("groupChallenges", () => {
  it("places active+joined challenges in activeParticipating", () => {
    const c = make({ status: ChallengeStatus.Active, isJoined: true, challengeId: 1 })
    const g = groupChallenges([c])
    expect(g.activeParticipating).toHaveLength(1)
    expect(g.activeParticipating[0]?.challengeId).toBe(1)
  })

  it("places pending+creator challenges in activeParticipating", () => {
    const c = make({ status: ChallengeStatus.Pending, isCreator: true, challengeId: 2 })
    const g = groupChallenges([c])
    expect(g.activeParticipating).toHaveLength(1)
  })

  it("places pending invitations in pendingInvites", () => {
    const c = make({ isInvitationPending: true, challengeId: 3 })
    const g = groupChallenges([c])
    expect(g.pendingInvites).toHaveLength(1)
  })

  it("places public joinable challenges in publicJoinable", () => {
    const c = make({
      status: ChallengeStatus.Pending,
      visibility: ChallengeVisibility.Public,
      canJoin: true,
      challengeId: 4,
    })
    const g = groupChallenges([c])
    expect(g.publicJoinable).toHaveLength(1)
  })

  it("does not place private challenges in publicJoinable", () => {
    const c = make({
      status: ChallengeStatus.Pending,
      visibility: ChallengeVisibility.Private,
      canJoin: true,
      challengeId: 5,
    })
    const g = groupChallenges([c])
    expect(g.publicJoinable).toHaveLength(0)
  })

  it("places finalized challenges in past when viewer participated", () => {
    const c = make({ status: ChallengeStatus.Finalized, isJoined: true, challengeId: 6 })
    const g = groupChallenges([c])
    expect(g.past).toHaveLength(1)
  })

  it("places cancelled challenges in past when viewer created them", () => {
    const c = make({ status: ChallengeStatus.Cancelled, isCreator: true, challengeId: 7 })
    const g = groupChallenges([c])
    expect(g.past).toHaveLength(1)
  })

  it("places claimable challenges in claimRewards", () => {
    const c = make({ status: ChallengeStatus.Finalized, canClaim: true, isJoined: true, challengeId: 8 })
    const g = groupChallenges([c])
    expect(g.claimRewards).toHaveLength(1)
    expect(g.past).toHaveLength(0)
  })

  it("places finalizable challenges in claimRewards instead of activeParticipating", () => {
    const c = make({ status: ChallengeStatus.Active, canFinalize: true, isCreator: true, challengeId: 10 })
    const g = groupChallenges([c])
    expect(g.claimRewards).toHaveLength(1)
    expect(g.activeParticipating).toHaveLength(0)
  })

  it("does not place unrelated completed challenges in past", () => {
    const c = make({ status: ChallengeStatus.Finalized, challengeId: 11 })
    const g = groupChallenges([c])
    expect(g.past).toHaveLength(0)
  })

  it("a challenge can appear in multiple groups", () => {
    const c = make({
      status: ChallengeStatus.Pending,
      visibility: ChallengeVisibility.Public,
      isCreator: true,
      canJoin: true,
      isInvitationPending: true,
      challengeId: 9,
    })
    const g = groupChallenges([c])
    expect(g.activeParticipating).toHaveLength(1)
    expect(g.pendingInvites).toHaveLength(1)
    expect(g.publicJoinable).toHaveLength(1)
  })

  it("returns empty groups for no challenges", () => {
    const g = groupChallenges([])
    expect(g.activeParticipating).toHaveLength(0)
    expect(g.pendingInvites).toHaveLength(0)
    expect(g.publicJoinable).toHaveLength(0)
    expect(g.claimRewards).toHaveLength(0)
    expect(g.past).toHaveLength(0)
  })
})
