import { mapIndexerChallengeDetail, mapIndexerChallengeView } from "./indexerChallenges"
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
      title: "Spring sprint",
      description: "",
      imageURI: "",
      metadataURI: "",
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
    expect(view.title).toBe("Spring sprint")
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
      title: "",
      description: "",
      imageURI: "",
      metadataURI: "",
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

  it("maps detail payloads and preserves address/app arrays", () => {
    const detail = mapIndexerChallengeDetail({
      challengeId: 3,
      createdAt: 789,
      kind: "Stake",
      visibility: "Public",
      thresholdMode: "TopAboveThreshold",
      status: "Active",
      settlementMode: "TopWinners",
      creator: "0x123",
      stakeAmount: "250",
      totalPrize: "500",
      startRound: 4,
      endRound: 6,
      duration: 3,
      threshold: "10",
      allApps: false,
      participantCount: 2,
      maxParticipants: 100,
      invitedCount: 1,
      declinedCount: 1,
      selectedAppsCount: 2,
      viewerStatus: "Joined",
      isCreator: false,
      isJoined: true,
      isInvitationPending: false,
      canJoin: false,
      canLeave: true,
      canAccept: false,
      canDecline: false,
      canCancel: false,
      canAddInvites: false,
      canClaim: false,
      canRefund: false,
      canFinalize: false,
      participants: ["0xaaa"],
      invited: ["0xbbb"],
      declined: ["0xccc"],
      selectedApps: ["app-1", "app-2"],
    })

    expect(detail.kind).toBe(ChallengeKind.Stake)
    expect(detail.thresholdMode).toBe(ThresholdMode.TopAboveThreshold)
    expect(detail.status).toBe(ChallengeStatus.Active)
    expect(detail.settlementMode).toBe(SettlementMode.TopWinners)
    expect(detail.viewerStatus).toBe(ParticipantStatus.Joined)
    expect(detail.participants).toEqual(["0xaaa"])
    expect(detail.invited).toEqual(["0xbbb"])
    expect(detail.declined).toEqual(["0xccc"])
    expect(detail.selectedApps).toEqual(["app-1", "app-2"])
  })
})
