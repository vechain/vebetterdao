import {
  mapIndexerChallengeDetail,
  mapIndexerChallengeView,
  type RawChallengeSummaryResponse,
} from "./indexerChallenges"
import {
  ChallengeAction,
  ChallengeKind,
  ChallengeStatus,
  ChallengeType,
  ChallengeViewerRelation,
  ChallengeVisibility,
  ParticipantStatus,
  SettlementMode,
} from "./types"

const createPublicChallenge = (): RawChallengeSummaryResponse => ({
  challengeId: 1,
  createdAt: 123,
  kind: "Sponsored",
  visibility: "Public",
  challengeType: "SplitWin",
  lifecycleStatus: "Completed",
  phase: "Ended",
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
})

describe("mapIndexerChallengeView", () => {
  it("maps public challenge responses to the frontend model", () => {
    const view = mapIndexerChallengeView(createPublicChallenge())

    expect(view.kind).toBe(ChallengeKind.Sponsored)
    expect(view.visibility).toBe(ChallengeVisibility.Public)
    expect(view.challengeType).toBe(ChallengeType.SplitWin)
    expect(view.status).toBe(ChallengeStatus.Completed)
    expect(view.settlementMode).toBe(SettlementMode.SplitWinCompleted)
    expect(view.viewerStatus).toBe(ParticipantStatus.None)
    expect(view.title).toBe("Spring sprint")
    expect(view.numWinners).toBe(5)
    expect(view.winnersClaimed).toBe(5)
    expect(view.prizePerWinner).toBe("200")
  })

  it("derives a join action for a connected viewer on a public pending challenge", () => {
    const view = mapIndexerChallengeView(
      {
        ...createPublicChallenge(),
        challengeType: "MaxActions",
        lifecycleStatus: "Pending",
        phase: "Upcoming",
        settlementMode: "None",
        creator: "0xabc",
        participantCount: 2,
        maxParticipants: 100,
      },
      "0xdef",
    )

    expect(view.status).toBe(ChallengeStatus.Pending)
    expect(view.canJoin).toBe(true)
    expect(view.isCreator).toBe(false)
    expect(view.viewerStatus).toBe(ParticipantStatus.None)
  })

  it("applies wallet state actions and viewer relation", () => {
    const view = mapIndexerChallengeView(createPublicChallenge(), "0xdef", {
      challengeId: 1,
      createdAt: 123,
      viewerRelation: ChallengeViewerRelation.Declined,
      availableActions: [ChallengeAction.AcceptInvite, ChallengeAction.DeclineInvite],
      participantActions: "7",
      isActionable: true,
      isParticipating: false,
      isHistorical: false,
    })

    expect(view.viewerStatus).toBe(ParticipantStatus.Declined)
    expect(view.isInvitationPending).toBe(false)
    expect(view.canAccept).toBe(true)
    expect(view.canDecline).toBe(true)
    expect(view.canJoin).toBe(false)
  })
})

describe("mapIndexerChallengeDetail", () => {
  it("marks split-win winners from the public detail payload", () => {
    const detail = mapIndexerChallengeDetail(
      {
        ...createPublicChallenge(),
        lifecycleStatus: "Active",
        phase: "Live",
        winners: ["0xdef"],
        participants: ["0xdef"],
        invited: [],
        declined: [],
        selectedApps: [],
      },
      "0xdef",
      {
        challengeId: 1,
        createdAt: 123,
        viewerRelation: ChallengeViewerRelation.Joined,
        availableActions: [],
        participantActions: "4",
        isActionable: false,
        isParticipating: true,
        isHistorical: false,
      },
    )

    expect(detail.viewerStatus).toBe(ParticipantStatus.Joined)
    expect(detail.isSplitWinWinner).toBe(true)
    expect(detail.participants).toEqual(["0xdef"])
  })
})
