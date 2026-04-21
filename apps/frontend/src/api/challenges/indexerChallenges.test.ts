import { mapIndexerChallengeView } from "./indexerChallenges"
import {
  ChallengeKind,
  ChallengeStatus,
  ChallengeType,
  ChallengeVisibility,
  ParticipantStatus,
  SettlementMode,
} from "./types"

describe("mapIndexerChallengeView", () => {
  it("maps string enums from the indexer response to frontend enum values", () => {
    const view = mapIndexerChallengeView({
      challengeId: 1,
      createdAt: 123,
      kind: "Sponsored",
      visibility: "Public",
      challengeType: "SplitWin",
      status: "Completed",
      settlementMode: "SplitWinCompleted",
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
      numWinners: 5,
      winnersClaimed: 5,
      prizePerWinner: "200",
      allApps: false,
      participantCount: 10,
      maxParticipants: 100,
      invitedCount: 0,
      declinedCount: 0,
      selectedAppsCount: 5,
      winnersCount: 5,
      viewerStatus: "Joined",
      isCreator: false,
      isJoined: true,
      isInvitationPending: false,
      isSplitWinWinner: true,
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
    })

    expect(view.kind).toBe(ChallengeKind.Sponsored)
    expect(view.visibility).toBe(ChallengeVisibility.Public)
    expect(view.challengeType).toBe(ChallengeType.SplitWin)
    expect(view.status).toBe(ChallengeStatus.Completed)
    expect(view.settlementMode).toBe(SettlementMode.SplitWinCompleted)
    expect(view.viewerStatus).toBe(ParticipantStatus.Joined)
    expect(view.title).toBe("Spring sprint")
    expect(view.numWinners).toBe(5)
    expect(view.winnersClaimed).toBe(5)
    expect(view.prizePerWinner).toBe("200")
    expect(view.isSplitWinWinner).toBe(true)
  })

  it("keeps numeric enum payloads unchanged", () => {
    const view = mapIndexerChallengeView({
      challengeId: 2,
      createdAt: 456,
      kind: ChallengeKind.Stake,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
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
      numWinners: 0,
      winnersClaimed: 0,
      prizePerWinner: "0",
      allApps: true,
      participantCount: 1,
      maxParticipants: 100,
      invitedCount: 0,
      declinedCount: 0,
      selectedAppsCount: 0,
      winnersCount: 0,
      viewerStatus: ParticipantStatus.None,
      isCreator: true,
      isJoined: false,
      isInvitationPending: false,
      isSplitWinWinner: false,
      canJoin: false,
      canLeave: false,
      canAccept: false,
      canDecline: false,
      canCancel: true,
      canAddInvites: false,
      canClaim: false,
      canRefund: false,
      canComplete: false,
      canClaimSplitWin: false,
      canClaimCreatorSplitWinRefund: false,
    })

    expect(view.kind).toBe(ChallengeKind.Stake)
    expect(view.status).toBe(ChallengeStatus.Pending)
    expect(view.viewerStatus).toBe(ParticipantStatus.None)
    expect(view.challengeType).toBe(ChallengeType.MaxActions)
  })
})
