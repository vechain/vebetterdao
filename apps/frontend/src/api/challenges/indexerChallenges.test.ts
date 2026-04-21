import { vi } from "vitest"

vi.mock("../contracts/xAllocations/hooks/useCurrentAllocationsRoundId", () => ({
  useCurrentAllocationsRoundId: () => ({
    data: "4",
    isLoading: false,
    isError: false,
    error: null,
  }),
}))

vi.mock("../indexer/api", () => ({
  indexerFetch: vi.fn(),
}))

vi.mock("./useChallengeParticipantActions", () => ({
  getChallengeParticipantActionRequestKey: ({
    challengeId,
    participant,
  }: {
    challengeId: number
    participant: string
  }) => `${challengeId}:${participant.toLowerCase()}`,
  useChallengeParticipantActionsBatch: () => ({
    data: {},
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
  }),
}))

import {
  mapIndexerChallengeDetail,
  mapIndexerChallengeView,
  type RawChallengeDetailResponse,
  type RawChallengeSummaryResponse,
} from "./indexerChallenges"
import {
  ChallengeKind,
  ChallengeStatus,
  ChallengeType,
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

const createChallengeDetail = (overrides: Partial<RawChallengeDetailResponse> = {}): RawChallengeDetailResponse => ({
  ...createPublicChallenge(),
  lifecycleStatus: "Pending",
  phase: "Upcoming",
  settlementMode: "None",
  challengeType: "MaxActions",
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
})

describe("mapIndexerChallengeDetail", () => {
  it("derives an invited private challenge from raw arrays", () => {
    const detail = mapIndexerChallengeDetail(
      createChallengeDetail({
        visibility: "Private",
        invited: ["0xdef"],
        eligibleInvitees: ["0xdef"],
      }),
      "0xdef",
      {
        currentRound: 4,
      },
    )

    expect(detail.viewerStatus).toBe(ParticipantStatus.Invited)
    expect(detail.isInvitationPending).toBe(true)
    expect(detail.canAccept).toBe(true)
    expect(detail.canDecline).toBe(true)
  })

  it("marks split-win winners from the raw detail payload", () => {
    const detail = mapIndexerChallengeDetail(
      createChallengeDetail({
        lifecycleStatus: "Active",
        phase: "Live",
        challengeType: "SplitWin",
        winners: ["0xdef"],
        participants: ["0xdef"],
      }),
      "0xdef",
      {
        currentRound: 4,
        participantActions: 4n,
      },
    )

    expect(detail.viewerStatus).toBe(ParticipantStatus.Joined)
    expect(detail.isSplitWinWinner).toBe(true)
    expect(detail.participants).toEqual(["0xdef"])
  })

  it("does not flag MaxActions top-winners as split-win winners", () => {
    const detail = mapIndexerChallengeDetail(
      createChallengeDetail({
        lifecycleStatus: "Completed",
        phase: "Ended",
        challengeType: "MaxActions",
        settlementMode: "TopWinners",
        winners: ["0xdef"],
        participants: ["0xdef"],
      }),
      "0xdef",
      {
        currentRound: 6,
      },
    )

    expect(detail.challengeType).toBe(ChallengeType.MaxActions)
    expect(detail.viewerStatus).toBe(ParticipantStatus.Joined)
    expect(detail.isSplitWinWinner).toBe(false)
  })

  it("derives split-win creator refund state from raw detail flags", () => {
    const detail = mapIndexerChallengeDetail(
      createChallengeDetail({
        lifecycleStatus: "Active",
        phase: "Ended",
        challengeType: "SplitWin",
        settlementMode: "SplitWinCompleted",
        creator: "0xabc",
        numWinners: 3,
        winnersClaimed: 1,
      }),
      "0xabc",
      {
        currentRound: 8,
      },
    )

    expect(detail.isCreator).toBe(true)
    expect(detail.canClaimCreatorSplitWinRefund).toBe(true)
  })
})
