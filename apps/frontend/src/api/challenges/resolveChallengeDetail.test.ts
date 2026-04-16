import {
  needsChallengeParticipantActions,
  resolveChallengeDetail,
  type ChallengeDetailResolverInput,
} from "./resolveChallengeDetail"
import {
  ChallengeKind,
  ChallengeStatus,
  ChallengeVisibility,
  ParticipantStatus,
  SettlementMode,
  ThresholdMode,
} from "./types"

const CREATOR = "0x0000000000000000000000000000000000000001"
const VIEWER = "0x0000000000000000000000000000000000000002"

const createChallenge = (overrides: Partial<ChallengeDetailResolverInput> = {}): ChallengeDetailResolverInput => ({
  challengeId: 1,
  createdAt: 0,
  kind: ChallengeKind.Sponsored,
  visibility: ChallengeVisibility.Public,
  thresholdMode: ThresholdMode.None,
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
  threshold: "0",
  allApps: true,
  participantCount: 0,
  invitedCount: 0,
  declinedCount: 0,
  selectedAppsCount: 0,
  bestScore: "0",
  bestCount: 0,
  qualifiedCount: 0,
  payoutsClaimed: 0,
  participants: [],
  invited: [],
  declined: [],
  selectedApps: [],
  viewerStatus: ParticipantStatus.None,
  isInvitationEligible: false,
  ...overrides,
})

describe("resolveChallengeDetail", () => {
  it("allows joining a public pending challenge when the viewer is eligible", () => {
    const detail = resolveChallengeDetail({
      challenge: createChallenge(),
      viewerAddress: VIEWER,
      currentRound: 4,
      maxParticipants: 10,
      hasClaimed: false,
      hasRefunded: false,
    })

    expect(detail.canJoin).toBe(true)
    expect(detail.canAccept).toBe(false)
    expect(detail.canFinalize).toBe(false)
  })

  it("allows re-accepting a declined private invite", () => {
    const detail = resolveChallengeDetail({
      challenge: createChallenge({
        visibility: ChallengeVisibility.Private,
        viewerStatus: ParticipantStatus.Declined,
        isInvitationEligible: true,
      }),
      viewerAddress: VIEWER,
      currentRound: 4,
      maxParticipants: 10,
      hasClaimed: false,
      hasRefunded: false,
    })

    expect(detail.isInvitationPending).toBe(true)
    expect(detail.canAccept).toBe(true)
    expect(detail.canDecline).toBe(false)
  })

  it("allows finalization after the end round for a participant", () => {
    const detail = resolveChallengeDetail({
      challenge: createChallenge({
        status: ChallengeStatus.Active,
        viewerStatus: ParticipantStatus.Joined,
        participantCount: 1,
        participants: [VIEWER],
        endRound: 7,
      }),
      viewerAddress: VIEWER,
      currentRound: 8,
      maxParticipants: 10,
      hasClaimed: false,
      hasRefunded: false,
    })

    expect(detail.canFinalize).toBe(true)
  })

  it("claims qualified split rewards only when the threshold is reached", () => {
    const challenge = createChallenge({
      status: ChallengeStatus.Finalized,
      settlementMode: SettlementMode.QualifiedSplit,
      thresholdMode: ThresholdMode.SplitAboveThreshold,
      threshold: "5",
      viewerStatus: ParticipantStatus.Joined,
      participantCount: 1,
      participants: [VIEWER],
    })

    expect(
      resolveChallengeDetail({
        challenge,
        viewerAddress: VIEWER,
        currentRound: 8,
        maxParticipants: 10,
        hasClaimed: false,
        hasRefunded: false,
        participantActions: 5n,
      }).canClaim,
    ).toBe(true)

    expect(
      resolveChallengeDetail({
        challenge,
        viewerAddress: VIEWER,
        currentRound: 8,
        maxParticipants: 10,
        hasClaimed: false,
        hasRefunded: false,
        participantActions: 4n,
      }).canClaim,
    ).toBe(false)
  })

  it("claims top winner rewards only for the best score", () => {
    const challenge = createChallenge({
      status: ChallengeStatus.Finalized,
      settlementMode: SettlementMode.TopWinners,
      viewerStatus: ParticipantStatus.Joined,
      participantCount: 1,
      participants: [VIEWER],
      bestScore: "7",
    })

    expect(
      resolveChallengeDetail({
        challenge,
        viewerAddress: VIEWER,
        currentRound: 8,
        maxParticipants: 10,
        hasClaimed: false,
        hasRefunded: false,
        participantActions: 7n,
      }).canClaim,
    ).toBe(true)

    expect(
      resolveChallengeDetail({
        challenge,
        viewerAddress: VIEWER,
        currentRound: 8,
        maxParticipants: 10,
        hasClaimed: false,
        hasRefunded: false,
        participantActions: 6n,
      }).canClaim,
    ).toBe(false)
  })

  it("refunds a joined participant on cancelled stake challenges", () => {
    const detail = resolveChallengeDetail({
      challenge: createChallenge({
        kind: ChallengeKind.Stake,
        status: ChallengeStatus.Cancelled,
        viewerStatus: ParticipantStatus.Joined,
        participantCount: 2,
        participants: [CREATOR, VIEWER],
        stakeAmount: "50",
      }),
      viewerAddress: VIEWER,
      currentRound: 8,
      maxParticipants: 10,
      hasClaimed: false,
      hasRefunded: false,
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
      maxParticipants: 10,
      hasClaimed: false,
      hasRefunded: false,
    })

    expect(detail.canRefund).toBe(true)
  })
})

describe("needsChallengeParticipantActions", () => {
  it("requires participant actions for joined finalists that have not claimed yet", () => {
    expect(
      needsChallengeParticipantActions(
        {
          status: ChallengeStatus.Finalized,
          settlementMode: SettlementMode.TopWinners,
          viewerStatus: ParticipantStatus.Joined,
        },
        false,
      ),
    ).toBe(true)
  })

  it("skips participant actions for creator refund settlements", () => {
    expect(
      needsChallengeParticipantActions(
        {
          status: ChallengeStatus.Finalized,
          settlementMode: SettlementMode.CreatorRefund,
          viewerStatus: ParticipantStatus.Joined,
        },
        false,
      ),
    ).toBe(false)
  })
})
