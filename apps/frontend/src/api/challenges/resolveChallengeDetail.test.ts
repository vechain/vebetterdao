import {
  needsChallengeParticipantActions,
  resolveChallengeDetail,
  type ChallengeDetailResolverInput,
} from "./resolveChallengeDetail"
import {
  ChallengeKind,
  ChallengeStatus,
  ChallengeType,
  ChallengeVisibility,
  ParticipantStatus,
  SettlementMode,
} from "./types"

const CREATOR = "0x0000000000000000000000000000000000000001"
const VIEWER = "0x0000000000000000000000000000000000000002"

const createChallenge = (overrides: Partial<ChallengeDetailResolverInput> = {}): ChallengeDetailResolverInput => ({
  challengeId: 1,
  createdAt: 0,
  kind: ChallengeKind.Sponsored,
  visibility: ChallengeVisibility.Public,
  challengeType: ChallengeType.SplitWin,
  status: ChallengeStatus.Pending,
  settlementMode: SettlementMode.None,
  creator: CREATOR,
  title: "Challenge",
  description: "",
  imageURI: "",
  metadataURI: "",
  stakeAmount: "0",
  totalPrize: "100",
  startRound: 5,
  endRound: 7,
  duration: 3,
  threshold: "5",
  numWinners: 2,
  winnersClaimed: 0,
  prizePerWinner: "50",
  allApps: true,
  participantCount: 0,
  maxParticipants: 10,
  invitedCount: 0,
  declinedCount: 0,
  selectedAppsCount: 0,
  winnersCount: 0,
  bestScore: "0",
  bestCount: 0,
  payoutsClaimed: 0,
  participants: [],
  invited: [],
  declined: [],
  selectedApps: [],
  winners: [],
  eligibleInvitees: [],
  claimedBy: [],
  refundedBy: [],
  creatorRefunded: false,
  ...overrides,
})

describe("resolveChallengeDetail", () => {
  it("allows joining a public pending Split Win challenge when the viewer is eligible", () => {
    const detail = resolveChallengeDetail({
      challenge: createChallenge(),
      viewerAddress: VIEWER,
      currentRound: 4,
    })

    expect(detail.canJoin).toBe(true)
    expect(detail.canAccept).toBe(false)
    expect(detail.canComplete).toBe(false)
  })

  it("allows re-accepting a declined private invite", () => {
    const detail = resolveChallengeDetail({
      challenge: createChallenge({
        visibility: ChallengeVisibility.Private,
        declined: [VIEWER],
        eligibleInvitees: [VIEWER],
      }),
      viewerAddress: VIEWER,
      currentRound: 4,
    })

    expect(detail.viewerStatus).toBe(ParticipantStatus.Declined)
    expect(detail.isInvitationPending).toBe(true)
    expect(detail.canAccept).toBe(true)
    expect(detail.canDecline).toBe(false)
  })

  it("derives cancel and add-invites for a pending private creator challenge", () => {
    const detail = resolveChallengeDetail({
      challenge: createChallenge({
        visibility: ChallengeVisibility.Private,
        creator: CREATOR,
        startRound: 6,
      }),
      viewerAddress: CREATOR,
      currentRound: 4,
    })

    expect(detail.canCancel).toBe(true)
    expect(detail.canAddInvites).toBe(true)
  })

  it("allows completion after the end round for a participant of a Max Actions challenge", () => {
    const detail = resolveChallengeDetail({
      challenge: createChallenge({
        challengeType: ChallengeType.MaxActions,
        threshold: "0",
        numWinners: 0,
        prizePerWinner: "0",
        status: ChallengeStatus.Active,
        participants: [VIEWER],
        participantCount: 1,
        endRound: 7,
      }),
      viewerAddress: VIEWER,
      currentRound: 8,
    })

    expect(detail.canComplete).toBe(true)
  })

  it("does not enforce the participant cap on Split Win challenges", () => {
    const detail = resolveChallengeDetail({
      challenge: createChallenge({
        participantCount: 999,
      }),
      viewerAddress: VIEWER,
      currentRound: 4,
    })

    expect(detail.canJoin).toBe(true)
  })

  it("allows Split Win claim when the viewer reaches the threshold within the active window", () => {
    const challenge = createChallenge({
      status: ChallengeStatus.Active,
      challengeType: ChallengeType.SplitWin,
      threshold: "5",
      numWinners: 2,
      winnersClaimed: 0,
      participants: [VIEWER],
      participantCount: 1,
    })

    expect(
      resolveChallengeDetail({
        challenge,
        viewerAddress: VIEWER,
        currentRound: 6,
        participantActions: 5n,
      }).canClaimSplitWin,
    ).toBe(true)

    expect(
      resolveChallengeDetail({
        challenge,
        viewerAddress: VIEWER,
        currentRound: 6,
        participantActions: 4n,
      }).canClaimSplitWin,
    ).toBe(false)
  })

  it("blocks Split Win claim once all slots are taken", () => {
    expect(
      resolveChallengeDetail({
        challenge: createChallenge({
          status: ChallengeStatus.Active,
          challengeType: ChallengeType.SplitWin,
          threshold: "1",
          numWinners: 1,
          winnersClaimed: 1,
          participants: [VIEWER],
          participantCount: 1,
        }),
        viewerAddress: VIEWER,
        currentRound: 6,
        participantActions: 5n,
      }).canClaimSplitWin,
    ).toBe(false)
  })

  it("allows the Split Win creator to refund unclaimed slots after endRound", () => {
    const detail = resolveChallengeDetail({
      challenge: createChallenge({
        status: ChallengeStatus.Active,
        challengeType: ChallengeType.SplitWin,
        threshold: "1",
        numWinners: 3,
        winnersClaimed: 1,
        endRound: 7,
      }),
      viewerAddress: CREATOR,
      currentRound: 9,
    })

    expect(detail.canClaimCreatorSplitWinRefund).toBe(true)
  })

  it("claims top winner rewards only for the best score on Max Actions completed", () => {
    const challenge = createChallenge({
      challengeType: ChallengeType.MaxActions,
      threshold: "0",
      numWinners: 0,
      prizePerWinner: "0",
      status: ChallengeStatus.Completed,
      settlementMode: SettlementMode.TopWinners,
      participants: [VIEWER],
      participantCount: 1,
      bestScore: "7",
    })

    expect(
      resolveChallengeDetail({
        challenge,
        viewerAddress: VIEWER,
        currentRound: 8,
        participantActions: 7n,
      }).canClaim,
    ).toBe(true)

    expect(
      resolveChallengeDetail({
        challenge,
        viewerAddress: VIEWER,
        currentRound: 8,
        participantActions: 6n,
      }).canClaim,
    ).toBe(false)
  })

  it("refunds a joined participant on cancelled stake challenges", () => {
    const detail = resolveChallengeDetail({
      challenge: createChallenge({
        kind: ChallengeKind.Stake,
        visibility: ChallengeVisibility.Private,
        challengeType: ChallengeType.MaxActions,
        threshold: "0",
        numWinners: 0,
        prizePerWinner: "0",
        status: ChallengeStatus.Cancelled,
        participants: [CREATOR, VIEWER],
        participantCount: 2,
        stakeAmount: "50",
      }),
      viewerAddress: VIEWER,
      currentRound: 8,
    })

    expect(detail.canRefund).toBe(true)
  })

  it("refunds the creator on invalid sponsored challenges", () => {
    const detail = resolveChallengeDetail({
      challenge: createChallenge({
        status: ChallengeStatus.Invalid,
      }),
      viewerAddress: CREATOR,
      currentRound: 8,
    })

    expect(detail.canRefund).toBe(true)
  })

  it("derives section membership from the resolved challenge state", () => {
    const actionable = resolveChallengeDetail({
      challenge: createChallenge({
        visibility: ChallengeVisibility.Private,
        invited: [VIEWER],
        eligibleInvitees: [VIEWER],
      }),
      viewerAddress: VIEWER,
      currentRound: 4,
    })
    const participating = resolveChallengeDetail({
      challenge: createChallenge({
        challengeType: ChallengeType.MaxActions,
        participants: [VIEWER],
        participantCount: 1,
        status: ChallengeStatus.Active,
      }),
      viewerAddress: VIEWER,
      currentRound: 6,
    })
    const history = resolveChallengeDetail({
      challenge: createChallenge({
        challengeType: ChallengeType.MaxActions,
        participants: [VIEWER],
        participantCount: 1,
        status: ChallengeStatus.Completed,
        settlementMode: SettlementMode.CreatorRefund,
        claimedBy: [VIEWER],
      }),
      viewerAddress: VIEWER,
      currentRound: 8,
    })

    expect(actionable.isActionable).toBe(true)
    expect(participating.isParticipating).toBe(true)
    expect(history.isHistorical).toBe(true)
  })
})

describe("needsChallengeParticipantActions", () => {
  it("requires participant actions for joined Max Actions completed challenges that have not claimed yet", () => {
    expect(
      needsChallengeParticipantActions(
        {
          challengeType: ChallengeType.MaxActions,
          status: ChallengeStatus.Completed,
          settlementMode: SettlementMode.TopWinners,
          creator: CREATOR,
          participants: [VIEWER],
          invited: [],
          declined: [],
          claimedBy: [],
        },
        VIEWER,
      ),
    ).toBe(true)
  })

  it("skips participant actions for creator refund settlements", () => {
    expect(
      needsChallengeParticipantActions(
        {
          challengeType: ChallengeType.MaxActions,
          status: ChallengeStatus.Completed,
          settlementMode: SettlementMode.CreatorRefund,
          creator: CREATOR,
          participants: [VIEWER],
          invited: [],
          declined: [],
          claimedBy: [],
        },
        VIEWER,
      ),
    ).toBe(false)
  })

  it("requires live participant actions for Split Win during Active so the user knows their progress", () => {
    expect(
      needsChallengeParticipantActions(
        {
          challengeType: ChallengeType.SplitWin,
          status: ChallengeStatus.Active,
          settlementMode: SettlementMode.None,
          creator: CREATOR,
          participants: [VIEWER],
          invited: [],
          declined: [],
          claimedBy: [],
        },
        VIEWER,
      ),
    ).toBe(true)
  })
})
