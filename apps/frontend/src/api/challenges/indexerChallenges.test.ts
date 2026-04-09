import { mapIndexerChallengeView } from "./indexerChallenges"
import {
  ChallengeKind,
  ChallengeStatus,
  ChallengeVisibility,
  ParticipantStatus,
  SettlementMode,
  ThresholdMode,
} from "./types"

describe("mapIndexerChallengeView", () => {
  it("maps string enums from the indexer response to frontend enum values", () => {
    const view = mapIndexerChallengeView({
      challengeId: 1,
      createdAt: 123,
      kind: "Sponsored",
      visibility: "Private",
      thresholdMode: "SplitAboveThreshold",
      status: "Finalized",
      settlementMode: "QualifiedSplit",
      creator: "0xabc",
      stakeAmount: "500",
      totalPrize: "1000",
      startRound: 2,
      endRound: 5,
      duration: 4,
      threshold: "3",
      allApps: false,
      participantCount: 10,
      maxParticipants: 100,
      invitedCount: 2,
      declinedCount: 1,
      selectedAppsCount: 5,
      viewerStatus: "Declined",
      isCreator: false,
      isJoined: false,
      isInvitationPending: true,
      canJoin: false,
      canLeave: false,
      canAccept: true,
      canDecline: false,
      canCancel: false,
      canAddInvites: false,
      canClaim: false,
      canRefund: false,
      canFinalize: false,
    })

    expect(view.kind).toBe(ChallengeKind.Sponsored)
    expect(view.visibility).toBe(ChallengeVisibility.Private)
    expect(view.thresholdMode).toBe(ThresholdMode.SplitAboveThreshold)
    expect(view.status).toBe(ChallengeStatus.Finalized)
    expect(view.settlementMode).toBe(SettlementMode.QualifiedSplit)
    expect(view.viewerStatus).toBe(ParticipantStatus.Declined)
  })

  it("keeps numeric enum payloads unchanged", () => {
    const view = mapIndexerChallengeView({
      challengeId: 2,
      createdAt: 456,
      kind: ChallengeKind.Stake,
      visibility: ChallengeVisibility.Public,
      thresholdMode: ThresholdMode.None,
      status: ChallengeStatus.Pending,
      settlementMode: SettlementMode.None,
      creator: "0xdef",
      stakeAmount: "100",
      totalPrize: "100",
      startRound: 1,
      endRound: 2,
      duration: 2,
      threshold: "0",
      allApps: true,
      participantCount: 1,
      maxParticipants: 100,
      invitedCount: 0,
      declinedCount: 0,
      selectedAppsCount: 0,
      viewerStatus: ParticipantStatus.None,
      isCreator: true,
      isJoined: false,
      isInvitationPending: false,
      canJoin: false,
      canLeave: false,
      canAccept: false,
      canDecline: false,
      canCancel: true,
      canAddInvites: false,
      canClaim: false,
      canRefund: false,
      canFinalize: false,
    })

    expect(view.kind).toBe(ChallengeKind.Stake)
    expect(view.status).toBe(ChallengeStatus.Pending)
    expect(view.viewerStatus).toBe(ParticipantStatus.None)
  })
})
