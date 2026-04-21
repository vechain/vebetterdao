import { expect } from "chai"
import { ethers } from "hardhat"
import { deployProxy } from "../../scripts/helpers"
import { challengesLibraries } from "../../scripts/libraries"
import { B3TR, B3TRChallenges, MockPassportActions, MockRoundGovernor, MockX2EarnApps } from "../../typechain-types"
import { ChallengeCoreLogic__factory } from "../../typechain-types/factories/contracts/challenges/libraries/ChallengeCoreLogic__factory"

const STAKE_AMOUNT = ethers.parseEther("100")
const MIN_BET_AMOUNT = ethers.parseEther("100")
const INITIAL_BALANCE = ethers.parseEther("1000")
const APP_1 = ethers.keccak256(ethers.toUtf8Bytes("app-1"))
const APP_2 = ethers.keccak256(ethers.toUtf8Bytes("app-2"))
const APP_3 = ethers.keccak256(ethers.toUtf8Bytes("app-3"))
const APP_4 = ethers.keccak256(ethers.toUtf8Bytes("app-4"))
const APP_5 = ethers.keccak256(ethers.toUtf8Bytes("app-5"))
const APP_6 = ethers.keccak256(ethers.toUtf8Bytes("app-6"))
const TITLE_MAX_BYTES = 120
const DESCRIPTION_MAX_BYTES = 500
const IMAGE_URI_MAX_BYTES = 512
const METADATA_URI_MAX_BYTES = 512

const ChallengeKind = {
  Stake: 0,
  Sponsored: 1,
} as const

const ChallengeVisibility = {
  Public: 0,
  Private: 1,
} as const

const ChallengeType = {
  MaxActions: 0,
  SplitWin: 1,
} as const

const ParticipantStatus = {
  None: 0,
  Invited: 1,
  Declined: 2,
  Joined: 3,
} as const

const ChallengeStatus = {
  Pending: 0,
  Active: 1,
  Completed: 2,
  Cancelled: 3,
  Invalid: 4,
} as const

const SettlementMode = {
  None: 0,
  TopWinners: 1,
  CreatorRefund: 2,
  SplitWinCompleted: 3,
} as const

async function deployFixture({
  maxParticipants = 100,
  minBetAmount = MIN_BET_AMOUNT,
}: { maxParticipants?: number; minBetAmount?: bigint } = {}) {
  const [admin, alice, bob, carol] = await ethers.getSigners()

  const b3tr = (await (
    await ethers.getContractFactory("B3TR")
  ).deploy(admin.address, admin.address, admin.address)) as B3TR
  await b3tr.waitForDeployment()

  const roundGovernor = (await (await ethers.getContractFactory("MockRoundGovernor")).deploy()) as MockRoundGovernor
  await roundGovernor.waitForDeployment()

  const passport = (await (await ethers.getContractFactory("MockPassportActions")).deploy()) as MockPassportActions
  await passport.waitForDeployment()

  const x2EarnApps = (await (await ethers.getContractFactory("MockX2EarnApps")).deploy()) as MockX2EarnApps
  await x2EarnApps.waitForDeployment()

  const { ChallengeCoreLogic: challengeCoreLogic, ChallengeSettlementLogic: challengeSettlementLogic } =
    await challengesLibraries({ logOutput: false })

  for (const appId of [APP_1, APP_2, APP_3, APP_4, APP_5, APP_6]) {
    await x2EarnApps.setAppExists(appId, true)
  }

  const challenges = (await deployProxy(
    "B3TRChallenges",
    [
      {
        b3trAddress: await b3tr.getAddress(),
        veBetterPassportAddress: await passport.getAddress(),
        xAllocationVotingAddress: await roundGovernor.getAddress(),
        x2EarnAppsAddress: await x2EarnApps.getAddress(),
        maxChallengeDuration: 4,
        maxSelectedApps: 5,
        maxParticipants,
        minBetAmount,
      },
      {
        admin: admin.address,
        upgrader: admin.address,
        contractsAddressManager: admin.address,
        settingsManager: admin.address,
      },
    ],
    {
      ChallengeCoreLogic: await challengeCoreLogic.getAddress(),
      ChallengeSettlementLogic: await challengeSettlementLogic.getAddress(),
    },
  )) as B3TRChallenges

  for (const signer of [admin, alice, bob, carol]) {
    await b3tr.mint(signer.address, INITIAL_BALANCE)
    await b3tr.connect(signer).approve(await challenges.getAddress(), INITIAL_BALANCE)
  }

  return { admin, alice, bob, carol, b3tr, roundGovernor, passport, x2EarnApps, challenges }
}

/**
 * Default helper: Stake + Private + MaxActions (the only valid Bet combination in the new matrix).
 * Pass `invitees` to allow others to join, or override fields explicitly for sponsored challenges.
 */
async function createChallenge(
  challenges: B3TRChallenges,
  overrides: Partial<Parameters<B3TRChallenges["createChallenge"]>[0]> = {},
) {
  return challenges.createChallenge({
    kind: ChallengeKind.Stake,
    visibility: ChallengeVisibility.Private,
    challengeType: ChallengeType.MaxActions,
    stakeAmount: STAKE_AMOUNT,
    startRound: 2,
    endRound: 3,
    threshold: 0,
    numWinners: 0,
    appIds: [APP_1],
    invitees: [],
    title: "",
    description: "",
    imageURI: "",
    metadataURI: "",
    ...overrides,
  })
}

describe("B3TRChallenges - @shard9a", function () {
  // ──── Creation: matrix + basic fields ────

  it("creates a Bet (Stake/Private/MaxActions) challenge and auto-adds the creator", async function () {
    const { admin, b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    const tx = await createChallenge(challenges, { invitees: [] })
    const receipt = await tx.wait()
    const challengeCreated = receipt?.logs
      .map(log => {
        try {
          return ChallengeCoreLogic__factory.createInterface().parseLog(log)
        } catch {
          return null
        }
      })
      .find(log => log?.name === "ChallengeCreated")

    expect(challengeCreated).to.not.equal(undefined)
    expect(challengeCreated?.args.challengeId).to.equal(1n)
    expect(challengeCreated?.args.creator).to.equal(admin.address)
    expect(challengeCreated?.args.endRound).to.equal(3n)
    expect(challengeCreated?.args.kind).to.equal(ChallengeKind.Stake)
    expect(challengeCreated?.args.visibility).to.equal(ChallengeVisibility.Private)
    expect(challengeCreated?.args.challengeType).to.equal(ChallengeType.MaxActions)
    expect(challengeCreated?.args.stakeAmount).to.equal(STAKE_AMOUNT)
    expect(challengeCreated?.args.startRound).to.equal(2n)
    expect(challengeCreated?.args.threshold).to.equal(0n)
    expect(challengeCreated?.args.allApps).to.equal(false)
    expect(challengeCreated?.args.selectedApps).to.deep.equal([APP_1])

    const challenge = await challenges.getChallenge(1)
    expect(challenge.creator).to.equal(admin.address)
    expect(challenge.participantCount).to.equal(1n)
    expect(challenge.totalPrize).to.equal(STAKE_AMOUNT)
    expect(challenge.numWinners).to.equal(0n)
    expect(challenge.prizePerWinner).to.equal(0n)
    expect(await challenges.getParticipantStatus(1, admin.address)).to.equal(ParticipantStatus.Joined)
    expect(await b3tr.balanceOf(await challenges.getAddress())).to.equal(STAKE_AMOUNT)
  })

  it("creates a Sponsored Public Split Win challenge with locked prizePerWinner", async function () {
    const { admin, b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    const sponsorAmount = ethers.parseEther("300")
    const tx = await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      challengeType: ChallengeType.SplitWin,
      stakeAmount: sponsorAmount,
      threshold: 5,
      numWinners: 3,
      appIds: [],
    })
    const receipt = await tx.wait()
    const splitConfigured = receipt?.logs
      .map(log => {
        try {
          return ChallengeCoreLogic__factory.createInterface().parseLog(log)
        } catch {
          return null
        }
      })
      .find(log => log?.name === "SplitWinConfigured")

    expect(splitConfigured?.args.numWinners).to.equal(3n)
    expect(splitConfigured?.args.prizePerWinner).to.equal(ethers.parseEther("100"))

    const challenge = await challenges.getChallenge(1)
    expect(challenge.challengeType).to.equal(ChallengeType.SplitWin)
    expect(challenge.numWinners).to.equal(3n)
    expect(challenge.threshold).to.equal(5n)
    expect(challenge.prizePerWinner).to.equal(ethers.parseEther("100"))
    expect(challenge.winnersClaimed).to.equal(0n)
    expect(challenge.participantCount).to.equal(0n)
    expect(await b3tr.balanceOf(await challenges.getAddress())).to.equal(sponsorAmount)
  })

  it("creates a Sponsored Private Max Actions challenge with no auto-creator", async function () {
    const { roundGovernor, challenges, alice } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      invitees: [alice.address],
    })

    const challenge = await challenges.getChallenge(1)
    expect(challenge.participantCount).to.equal(0n)
    expect(challenge.invitedCount).to.equal(1n)
  })

  // ──── Matrix rejection cases ────

  it("rejects Bet (Stake) Public", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(
      createChallenge(challenges, {
        kind: ChallengeKind.Stake,
        visibility: ChallengeVisibility.Public,
        challengeType: ChallengeType.MaxActions,
      }),
    ).to.be.revertedWithCustomError(challenges, "InvalidChallengeTypeForCombo")
  })

  it("rejects Bet (Stake) with SplitWin", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(
      createChallenge(challenges, {
        kind: ChallengeKind.Stake,
        visibility: ChallengeVisibility.Private,
        challengeType: ChallengeType.SplitWin,
        threshold: 5,
        numWinners: 3,
      }),
    ).to.be.revertedWithCustomError(challenges, "InvalidChallengeTypeForCombo")
  })

  it("rejects Sponsored Public with MaxActions (only SplitWin allowed)", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(
      createChallenge(challenges, {
        kind: ChallengeKind.Sponsored,
        visibility: ChallengeVisibility.Public,
        challengeType: ChallengeType.MaxActions,
      }),
    ).to.be.revertedWithCustomError(challenges, "InvalidChallengeTypeForCombo")
  })

  it("rejects MaxActions with non-zero threshold or numWinners", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(createChallenge(challenges, { threshold: 5 })).to.be.revertedWithCustomError(
      challenges,
      "InvalidTypeConfiguration",
    )
    await expect(createChallenge(challenges, { numWinners: 2 })).to.be.revertedWithCustomError(
      challenges,
      "InvalidTypeConfiguration",
    )
  })

  it("rejects SplitWin with zero threshold or zero numWinners", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(
      createChallenge(challenges, {
        kind: ChallengeKind.Sponsored,
        visibility: ChallengeVisibility.Public,
        challengeType: ChallengeType.SplitWin,
        threshold: 0,
        numWinners: 3,
      }),
    ).to.be.revertedWithCustomError(challenges, "InvalidTypeConfiguration")

    await expect(
      createChallenge(challenges, {
        kind: ChallengeKind.Sponsored,
        visibility: ChallengeVisibility.Public,
        challengeType: ChallengeType.SplitWin,
        threshold: 5,
        numWinners: 0,
      }),
    ).to.be.revertedWithCustomError(challenges, "InvalidTypeConfiguration")
  })

  it("rejects SplitWin when stakeAmount < numWinners * 1 B3TR (InsufficientPrizePerWinner)", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(
      createChallenge(challenges, {
        kind: ChallengeKind.Sponsored,
        visibility: ChallengeVisibility.Public,
        challengeType: ChallengeType.SplitWin,
        stakeAmount: ethers.parseEther("100"),
        threshold: 5,
        numWinners: 101,
        appIds: [],
      }),
    ).to.be.revertedWithCustomError(challenges, "InsufficientPrizePerWinner")

    const { roundGovernor: rg2, challenges: ch2 } = await deployFixture({ minBetAmount: ethers.parseEther("1") })
    await rg2.setCurrentRoundId(1)

    await expect(
      createChallenge(ch2, {
        kind: ChallengeKind.Sponsored,
        visibility: ChallengeVisibility.Public,
        challengeType: ChallengeType.SplitWin,
        stakeAmount: ethers.parseEther("10"),
        threshold: 5,
        numWinners: 11,
        appIds: [],
      }),
    ).to.be.revertedWithCustomError(ch2, "InsufficientPrizePerWinner")
  })

  it("accepts SplitWin when stakeAmount == numWinners * 1 B3TR (exactly 1 B3TR per winner)", async function () {
    const { roundGovernor, challenges } = await deployFixture({ minBetAmount: ethers.parseEther("1") })
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      challengeType: ChallengeType.SplitWin,
      stakeAmount: ethers.parseEther("5"),
      threshold: 1,
      numWinners: 5,
      appIds: [],
    })

    const challenge = await challenges.getChallenge(1)
    expect(challenge.prizePerWinner).to.equal(ethers.parseEther("1"))
  })

  it("rejects SplitWin when threshold > 1_000_000 (ThresholdTooHigh)", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(
      createChallenge(challenges, {
        kind: ChallengeKind.Sponsored,
        visibility: ChallengeVisibility.Public,
        challengeType: ChallengeType.SplitWin,
        stakeAmount: ethers.parseEther("100"),
        threshold: 1_000_001,
        numWinners: 3,
        appIds: [],
      }),
    ).to.be.revertedWithCustomError(challenges, "ThresholdTooHigh")
  })

  it("accepts SplitWin when threshold == 1_000_000", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      challengeType: ChallengeType.SplitWin,
      stakeAmount: ethers.parseEther("100"),
      threshold: 1_000_000,
      numWinners: 3,
      appIds: [],
    })

    const challenge = await challenges.getChallenge(1)
    expect(challenge.threshold).to.equal(1_000_000n)
  })

  // ──── Metadata ────

  it("stores metadata fields at their maximum allowed lengths", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      title: "t".repeat(TITLE_MAX_BYTES),
      description: "d".repeat(DESCRIPTION_MAX_BYTES),
      imageURI: "i".repeat(IMAGE_URI_MAX_BYTES),
      metadataURI: "m".repeat(METADATA_URI_MAX_BYTES),
    })

    const challenge = await challenges.getChallenge(1)
    expect(challenge.title).to.equal("t".repeat(TITLE_MAX_BYTES))
    expect(challenge.description).to.equal("d".repeat(DESCRIPTION_MAX_BYTES))
    expect(challenge.imageURI).to.equal("i".repeat(IMAGE_URI_MAX_BYTES))
    expect(challenge.metadataURI).to.equal("m".repeat(METADATA_URI_MAX_BYTES))
  })

  it("rejects metadata fields that exceed their maximum lengths", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(createChallenge(challenges, { title: "t".repeat(TITLE_MAX_BYTES + 1) }))
      .to.be.revertedWithCustomError(challenges, "TitleTooLong")
      .withArgs(TITLE_MAX_BYTES + 1, TITLE_MAX_BYTES)

    await expect(createChallenge(challenges, { description: "d".repeat(DESCRIPTION_MAX_BYTES + 1) }))
      .to.be.revertedWithCustomError(challenges, "DescriptionTooLong")
      .withArgs(DESCRIPTION_MAX_BYTES + 1, DESCRIPTION_MAX_BYTES)

    await expect(createChallenge(challenges, { imageURI: "i".repeat(IMAGE_URI_MAX_BYTES + 1) }))
      .to.be.revertedWithCustomError(challenges, "ImageURITooLong")
      .withArgs(IMAGE_URI_MAX_BYTES + 1, IMAGE_URI_MAX_BYTES)

    await expect(createChallenge(challenges, { metadataURI: "m".repeat(METADATA_URI_MAX_BYTES + 1) }))
      .to.be.revertedWithCustomError(challenges, "MetadataURITooLong")
      .withArgs(METADATA_URI_MAX_BYTES + 1, METADATA_URI_MAX_BYTES)
  })

  // ──── Participant cap (MaxActions only) ────

  it("rejects joining a Sponsored Private Max Actions challenge after the participant cap", async function () {
    const { alice, bob, carol, roundGovernor, challenges } = await deployFixture({ maxParticipants: 2 })
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      invitees: [alice.address, bob.address, carol.address],
    })

    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)

    await expect(challenges.connect(carol).joinChallenge(1))
      .to.be.revertedWithCustomError(challenges, "MaxParticipantsExceeded")
      .withArgs(3, 2)
  })

  it("counts the creator toward the participant cap on Bet challenges", async function () {
    const { alice, bob, carol, roundGovernor, challenges } = await deployFixture({ maxParticipants: 3 })
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { invitees: [alice.address, bob.address, carol.address] })
    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)

    await expect(challenges.connect(carol).joinChallenge(1))
      .to.be.revertedWithCustomError(challenges, "MaxParticipantsExceeded")
      .withArgs(4, 3)
  })

  it("does NOT enforce the participant cap on Split Win challenges", async function () {
    const { alice, bob, carol, roundGovernor, challenges } = await deployFixture({ maxParticipants: 1 })
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      challengeType: ChallengeType.SplitWin,
      stakeAmount: ethers.parseEther("300"),
      threshold: 5,
      numWinners: 3,
    })

    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)
    await challenges.connect(carol).joinChallenge(1)

    expect((await challenges.getChallenge(1)).participantCount).to.equal(3n)
  })

  // ──── Round / app validations ────

  it("rejects challenges whose start round is not after the current round", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(2)

    await expect(createChallenge(challenges, { startRound: 2, endRound: 2 }))
      .to.be.revertedWithCustomError(challenges, "InvalidStartRound")
      .withArgs(2, 2)
  })

  it("rejects challenges whose end round is before the start round", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(createChallenge(challenges, { startRound: 3, endRound: 2 }))
      .to.be.revertedWithCustomError(challenges, "InvalidEndRound")
      .withArgs(3, 2)
  })

  it("allows selecting up to five apps", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { appIds: [APP_1, APP_2, APP_3, APP_4, APP_5] })

    const challenge = await challenges.getChallenge(1)
    expect(challenge.allApps).to.equal(false)
    expect(challenge.selectedAppsCount).to.equal(5n)
  })

  it("rejects challenges with more than five selected apps", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(createChallenge(challenges, { appIds: [APP_1, APP_2, APP_3, APP_4, APP_5, APP_6] }))
      .to.be.revertedWithCustomError(challenges, "MaxSelectedAppsExceeded")
      .withArgs(6, 5)
  })

  it("treats an empty app selection as all apps", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { appIds: [] })

    const challenge = await challenges.getChallenge(1)
    expect(challenge.allApps).to.equal(true)
    expect(challenge.selectedAppsCount).to.equal(0n)
  })

  // ──── Invitations / lifecycle ────

  it("lets an invited user decline and later join a private sponsored challenge", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      invitees: [alice.address],
      appIds: [],
    })

    await challenges.connect(alice).declineChallenge(1)
    expect(await challenges.getParticipantStatus(1, alice.address)).to.equal(ParticipantStatus.Declined)

    await challenges.connect(alice).joinChallenge(1)

    const challenge = await challenges.getChallenge(1)
    expect(challenge.participantCount).to.equal(1n)
    expect(await challenges.getParticipantStatus(1, alice.address)).to.equal(ParticipantStatus.Joined)
  })

  it("marks an unjoined Bet challenge invalid and refunds the creator", async function () {
    const { admin, b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { endRound: 2 })
    await roundGovernor.setCurrentRoundId(2)

    await challenges.syncChallenge(1)
    expect(await challenges.getChallengeStatus(1)).to.equal(ChallengeStatus.Invalid)

    await challenges.claimChallengeRefund(1)

    expect(await b3tr.balanceOf(admin.address)).to.equal(INITIAL_BALANCE)
  })

  it("cancels a Bet challenge and refunds creator and participant", async function () {
    const { admin, alice, b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { invitees: [alice.address] })
    await challenges.connect(alice).joinChallenge(1)
    await challenges.cancelChallenge(1)

    await challenges.claimChallengeRefund(1)
    await challenges.connect(alice).claimChallengeRefund(1)

    expect(await b3tr.balanceOf(admin.address)).to.equal(INITIAL_BALANCE)
    expect(await b3tr.balanceOf(alice.address)).to.equal(INITIAL_BALANCE)
  })

  // ──── Max Actions completion + payout ────

  it("completes and splits the Bet pot between tied winners", async function () {
    const { admin, alice, bob, b3tr, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      appIds: [APP_1, APP_2],
      endRound: 3,
      invitees: [alice.address, bob.address],
    })
    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)

    await passport.setUserRoundActionCountApp(admin.address, 2, APP_1, 1)
    await passport.setUserRoundActionCountApp(alice.address, 2, APP_1, 2)
    await passport.setUserRoundActionCountApp(alice.address, 3, APP_2, 3)
    await passport.setUserRoundActionCountApp(bob.address, 2, APP_1, 4)
    await passport.setUserRoundActionCountApp(bob.address, 3, APP_2, 1)

    await roundGovernor.setCurrentRoundId(4)

    await challenges.completeChallenge(1)

    const challenge = await challenges.getChallenge(1)
    expect(challenge.status).to.equal(ChallengeStatus.Completed)
    expect(challenge.bestScore).to.equal(5n)
    expect(challenge.bestCount).to.equal(2n)
    expect(challenge.settlementMode).to.equal(SettlementMode.TopWinners)

    await expect(challenges.claimChallengePayout(1)).to.be.revertedWithCustomError(challenges, "NothingToClaim")

    await challenges.connect(alice).claimChallengePayout(1)
    await challenges.connect(bob).claimChallengePayout(1)

    expect(await b3tr.balanceOf(alice.address)).to.equal(INITIAL_BALANCE + ethers.parseEther("50"))
    expect(await b3tr.balanceOf(bob.address)).to.equal(INITIAL_BALANCE + ethers.parseEther("50"))
  })

  it("refunds the sponsor when nobody participates in a Sponsored Private Max Actions challenge", async function () {
    const { admin, b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      appIds: [],
      endRound: 3,
    })

    await roundGovernor.setCurrentRoundId(4)
    await challenges.syncChallenge(1)
    expect(await challenges.getChallengeStatus(1)).to.equal(ChallengeStatus.Invalid)

    await challenges.claimChallengeRefund(1)
    expect(await b3tr.balanceOf(admin.address)).to.equal(INITIAL_BALANCE)
  })

  // ──── Split Win lifecycle ────

  it("Split Win: joiners can claim a slot once they reach the threshold; first-come first-served", async function () {
    const { admin, alice, bob, b3tr, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    const sponsorAmount = ethers.parseEther("300")
    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      challengeType: ChallengeType.SplitWin,
      stakeAmount: sponsorAmount,
      threshold: 3,
      numWinners: 2,
      appIds: [],
      endRound: 3,
    })

    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)

    await roundGovernor.setCurrentRoundId(2)
    await challenges.syncChallenge(1)
    expect(await challenges.getChallengeStatus(1)).to.equal(ChallengeStatus.Active)

    // Below threshold → reverts
    await passport.setUserRoundActionCount(alice.address, 2, 2)
    await expect(challenges.connect(alice).claimSplitWinPrize(1)).to.be.revertedWithCustomError(
      challenges,
      "NotEligibleForSplitWin",
    )

    // Reaches threshold → claims first slot
    await passport.setUserRoundActionCount(alice.address, 2, 3)
    await challenges.connect(alice).claimSplitWinPrize(1)
    expect(await b3tr.balanceOf(alice.address)).to.equal(INITIAL_BALANCE + ethers.parseEther("150"))
    expect((await challenges.getChallenge(1)).winnersClaimed).to.equal(1n)
    expect(await challenges.isSplitWinWinner(1, alice.address)).to.equal(true)

    // Bob claims second slot — flips status to Completed
    await passport.setUserRoundActionCount(bob.address, 2, 4)
    await challenges.connect(bob).claimSplitWinPrize(1)
    expect(await b3tr.balanceOf(bob.address)).to.equal(INITIAL_BALANCE + ethers.parseEther("150"))

    const challenge = await challenges.getChallenge(1)
    expect(challenge.winnersClaimed).to.equal(2n)
    expect(challenge.status).to.equal(ChallengeStatus.Completed)
    expect(challenge.settlementMode).to.equal(SettlementMode.SplitWinCompleted)
    expect(await challenges.getChallengeWinners(1)).to.deep.equal([alice.address, bob.address])

    // Creator pool drained, contract holds nothing
    expect(await b3tr.balanceOf(await challenges.getAddress())).to.equal(0n)
    expect(await b3tr.balanceOf(admin.address)).to.equal(INITIAL_BALANCE - sponsorAmount)
  })

  it("Split Win: rejects claim once all slots are exhausted", async function () {
    const { alice, bob, carol, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      challengeType: ChallengeType.SplitWin,
      stakeAmount: ethers.parseEther("100"),
      threshold: 1,
      numWinners: 1,
      appIds: [],
      endRound: 3,
    })

    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)
    await challenges.connect(carol).joinChallenge(1)

    await roundGovernor.setCurrentRoundId(2)
    await passport.setUserRoundActionCount(alice.address, 2, 1)
    await passport.setUserRoundActionCount(bob.address, 2, 1)

    await challenges.connect(alice).claimSplitWinPrize(1)
    await expect(challenges.connect(bob).claimSplitWinPrize(1)).to.be.revertedWithCustomError(
      challenges,
      "ChallengeInvalidStatus",
    )
  })

  it("Split Win: same winner cannot claim twice", async function () {
    const { alice, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      challengeType: ChallengeType.SplitWin,
      stakeAmount: ethers.parseEther("200"),
      threshold: 1,
      numWinners: 2,
      appIds: [],
      endRound: 3,
    })

    await challenges.connect(alice).joinChallenge(1)
    await roundGovernor.setCurrentRoundId(2)
    await passport.setUserRoundActionCount(alice.address, 2, 1)

    await challenges.connect(alice).claimSplitWinPrize(1)
    await expect(challenges.connect(alice).claimSplitWinPrize(1)).to.be.revertedWithCustomError(
      challenges,
      "AlreadyClaimed",
    )
  })

  it("Split Win: non-participant cannot claim", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      challengeType: ChallengeType.SplitWin,
      stakeAmount: ethers.parseEther("100"),
      threshold: 1,
      numWinners: 1,
      appIds: [],
      endRound: 3,
    })
    await roundGovernor.setCurrentRoundId(2)
    await challenges.syncChallenge(1)
    expect(await challenges.getChallengeStatus(1)).to.equal(ChallengeStatus.Invalid)

    await expect(challenges.connect(alice).claimSplitWinPrize(1)).to.be.revertedWithCustomError(
      challenges,
      "ChallengeInvalidStatus",
    )
  })

  it("Split Win: rejects claim after endRound", async function () {
    const { alice, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      challengeType: ChallengeType.SplitWin,
      stakeAmount: ethers.parseEther("100"),
      threshold: 1,
      numWinners: 1,
      appIds: [],
      endRound: 2,
    })

    await challenges.connect(alice).joinChallenge(1)
    await passport.setUserRoundActionCount(alice.address, 2, 1)

    await roundGovernor.setCurrentRoundId(3)
    await expect(challenges.connect(alice).claimSplitWinPrize(1)).to.be.revertedWithCustomError(
      challenges,
      "ChallengeEnded",
    )
  })

  it("Split Win: completeChallenge rejects with SplitWinCannotComplete", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      challengeType: ChallengeType.SplitWin,
      stakeAmount: ethers.parseEther("100"),
      threshold: 1,
      numWinners: 1,
      appIds: [],
      endRound: 2,
    })
    await challenges.connect(alice).joinChallenge(1)
    await roundGovernor.setCurrentRoundId(3)

    await expect(challenges.completeChallenge(1)).to.be.revertedWithCustomError(challenges, "SplitWinCannotComplete")
  })

  it("Split Win: creator can refund unclaimed slots after endRound (incl. integer remainder)", async function () {
    const { admin, alice, b3tr, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    // 100 / 3 = 33 per winner, 1 wei remainder
    const sponsorAmount = ethers.parseEther("100")
    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      challengeType: ChallengeType.SplitWin,
      stakeAmount: sponsorAmount,
      threshold: 1,
      numWinners: 3,
      appIds: [],
      endRound: 2,
    })

    await challenges.connect(alice).joinChallenge(1)
    await passport.setUserRoundActionCount(alice.address, 2, 1)
    await roundGovernor.setCurrentRoundId(2)
    await challenges.connect(alice).claimSplitWinPrize(1)

    const prizePerWinner = sponsorAmount / 3n
    expect(await b3tr.balanceOf(alice.address)).to.equal(INITIAL_BALANCE + prizePerWinner)

    // After endRound, creator reclaims 2 unclaimed slots + remainder
    await roundGovernor.setCurrentRoundId(3)
    await challenges.claimCreatorSplitWinRefund(1)

    const refunded = sponsorAmount - prizePerWinner
    expect(await b3tr.balanceOf(admin.address)).to.equal(INITIAL_BALANCE - sponsorAmount + refunded)
    expect(await b3tr.balanceOf(await challenges.getAddress())).to.equal(0n)

    const challenge = await challenges.getChallenge(1)
    expect(challenge.status).to.equal(ChallengeStatus.Completed)
    expect(challenge.settlementMode).to.equal(SettlementMode.SplitWinCompleted)
  })

  it("Split Win: creator refund rejects before endRound", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      challengeType: ChallengeType.SplitWin,
      stakeAmount: ethers.parseEther("100"),
      threshold: 1,
      numWinners: 2,
      appIds: [],
      endRound: 3,
    })
    await challenges.connect(alice).joinChallenge(1)
    await roundGovernor.setCurrentRoundId(2)
    await challenges.syncChallenge(1)

    await expect(challenges.claimCreatorSplitWinRefund(1)).to.be.revertedWithCustomError(
      challenges,
      "ChallengeNotEnded",
    )
  })

  it("Split Win: creator refund rejects when all slots already claimed", async function () {
    const { alice, bob, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      challengeType: ChallengeType.SplitWin,
      stakeAmount: ethers.parseEther("200"),
      threshold: 1,
      numWinners: 2,
      appIds: [],
      endRound: 2,
    })

    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)
    await roundGovernor.setCurrentRoundId(2)
    await passport.setUserRoundActionCount(alice.address, 2, 1)
    await passport.setUserRoundActionCount(bob.address, 2, 1)
    await challenges.connect(alice).claimSplitWinPrize(1)
    await challenges.connect(bob).claimSplitWinPrize(1)

    await roundGovernor.setCurrentRoundId(3)
    await expect(challenges.claimCreatorSplitWinRefund(1)).to.be.revertedWithCustomError(challenges, "NothingToRefund")
  })

  it("Split Win: only the creator can claim the refund", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      challengeType: ChallengeType.SplitWin,
      stakeAmount: ethers.parseEther("100"),
      threshold: 1,
      numWinners: 2,
      appIds: [],
      endRound: 2,
    })
    await challenges.connect(alice).joinChallenge(1)
    await roundGovernor.setCurrentRoundId(3)

    await expect(challenges.connect(alice).claimCreatorSplitWinRefund(1)).to.be.revertedWithCustomError(
      challenges,
      "ChallengesUnauthorizedUser",
    )
  })

  it("Split Win: claim across multiple rounds and selected apps reads live progress", async function () {
    const { alice, roundGovernor, passport, challenges, b3tr } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      challengeType: ChallengeType.SplitWin,
      stakeAmount: ethers.parseEther("100"),
      threshold: 4,
      numWinners: 1,
      appIds: [APP_1, APP_2],
      endRound: 4,
    })
    await challenges.connect(alice).joinChallenge(1)

    await passport.setUserRoundActionCountApp(alice.address, 2, APP_1, 1)
    await passport.setUserRoundActionCountApp(alice.address, 3, APP_2, 1)

    await roundGovernor.setCurrentRoundId(3)
    await expect(challenges.connect(alice).claimSplitWinPrize(1)).to.be.revertedWithCustomError(
      challenges,
      "NotEligibleForSplitWin",
    )

    await passport.setUserRoundActionCountApp(alice.address, 4, APP_1, 2)
    await roundGovernor.setCurrentRoundId(4)
    await challenges.connect(alice).claimSplitWinPrize(1)

    expect(await b3tr.balanceOf(alice.address)).to.equal(INITIAL_BALANCE + ethers.parseEther("100"))
  })

  // ──── View functions ────

  it("returns version, challengeCount, and config getters", async function () {
    const { challenges, roundGovernor } = await deployFixture()
    expect(await challenges.version()).to.equal("1")
    expect(await challenges.challengeCount()).to.equal(0n)
    expect(await challenges.maxChallengeDuration()).to.equal(4n)
    expect(await challenges.maxSelectedApps()).to.equal(5n)
    expect(await challenges.maxParticipants()).to.equal(100n)
    expect(await challenges.minBetAmount()).to.equal(MIN_BET_AMOUNT)

    await roundGovernor.setCurrentRoundId(1)
    await createChallenge(challenges)
    expect(await challenges.challengeCount()).to.equal(1n)
  })

  it("returns participants, invited, declined, selectedApps, and invitation eligibility", async function () {
    const { admin, alice, bob, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      invitees: [alice.address, bob.address],
      appIds: [APP_1, APP_2],
    })

    expect(await challenges.getChallengeSelectedApps(1)).to.deep.equal([APP_1, APP_2])
    expect(await challenges.isInvitationEligible(1, alice.address)).to.equal(true)
    expect(await challenges.isInvitationEligible(1, admin.address)).to.equal(false)

    const invited = await challenges.getChallengeInvited(1)
    expect(invited).to.include(alice.address)
    expect(invited).to.include(bob.address)

    await challenges.connect(alice).joinChallenge(1)
    expect(await challenges.getChallengeParticipants(1)).to.deep.equal([alice.address])

    await challenges.connect(bob).declineChallenge(1)
    expect(await challenges.getChallengeDeclined(1)).to.deep.equal([bob.address])
  })

  it("returns participant actions via getParticipantActions", async function () {
    const { admin, alice, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { appIds: [APP_1], endRound: 2, invitees: [alice.address] })
    await challenges.connect(alice).joinChallenge(1)

    await passport.setUserRoundActionCountApp(alice.address, 2, APP_1, 7)
    expect(await challenges.getParticipantActions(1, alice.address)).to.equal(7n)
    expect(await challenges.getParticipantActions(1, admin.address)).to.equal(0n)
  })

  it("reverts view functions for non-existent challenges", async function () {
    const { admin, challenges } = await deployFixture()

    await expect(challenges.getChallenge(0)).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
    await expect(challenges.getChallenge(99)).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
    await expect(challenges.getChallengeParticipants(0)).to.be.revertedWithCustomError(
      challenges,
      "ChallengeDoesNotExist",
    )
    await expect(challenges.getChallengeInvited(99)).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
    await expect(challenges.getChallengeDeclined(99)).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
    await expect(challenges.getChallengeSelectedApps(0)).to.be.revertedWithCustomError(
      challenges,
      "ChallengeDoesNotExist",
    )
    await expect(challenges.getChallengeWinners(99)).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
    await expect(challenges.getParticipantStatus(0, admin.address)).to.be.revertedWithCustomError(
      challenges,
      "ChallengeDoesNotExist",
    )
    await expect(challenges.isInvitationEligible(0, admin.address)).to.be.revertedWithCustomError(
      challenges,
      "ChallengeDoesNotExist",
    )
    await expect(challenges.isSplitWinWinner(99, admin.address)).to.be.revertedWithCustomError(
      challenges,
      "ChallengeDoesNotExist",
    )
    await expect(challenges.getChallengeStatus(0)).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
  })

  // ──── Admin setters ────

  it("updates address setters and emits events", async function () {
    const { alice, challenges } = await deployFixture()

    await expect(challenges.setB3TRAddress(alice.address)).to.emit(challenges, "B3TRAddressUpdated")
    await expect(challenges.setVeBetterPassportAddress(alice.address)).to.emit(
      challenges,
      "VeBetterPassportAddressUpdated",
    )
    await expect(challenges.setXAllocationVotingAddress(alice.address)).to.emit(
      challenges,
      "XAllocationVotingAddressUpdated",
    )
    await expect(challenges.setX2EarnAppsAddress(alice.address)).to.emit(challenges, "X2EarnAppsAddressUpdated")
  })

  it("reverts address setters with zero address", async function () {
    const { challenges } = await deployFixture()
    const zero = ethers.ZeroAddress

    await expect(challenges.setB3TRAddress(zero)).to.be.revertedWithCustomError(challenges, "ZeroAddress")
    await expect(challenges.setVeBetterPassportAddress(zero)).to.be.revertedWithCustomError(challenges, "ZeroAddress")
    await expect(challenges.setXAllocationVotingAddress(zero)).to.be.revertedWithCustomError(challenges, "ZeroAddress")
    await expect(challenges.setX2EarnAppsAddress(zero)).to.be.revertedWithCustomError(challenges, "ZeroAddress")
  })

  it("updates settings and emits events", async function () {
    const { challenges } = await deployFixture()

    await expect(challenges.setMaxChallengeDuration(10))
      .to.emit(challenges, "MaxChallengeDurationUpdated")
      .withArgs(4, 10)
    expect(await challenges.maxChallengeDuration()).to.equal(10n)

    await expect(challenges.setMaxSelectedApps(8)).to.emit(challenges, "MaxSelectedAppsUpdated").withArgs(5, 8)
    expect(await challenges.maxSelectedApps()).to.equal(8n)

    await expect(challenges.setMaxParticipants(50)).to.emit(challenges, "MaxParticipantsUpdated").withArgs(100, 50)
    expect(await challenges.maxParticipants()).to.equal(50n)

    await expect(challenges.setMinBetAmount(ethers.parseEther("150")))
      .to.emit(challenges, "MinBetAmountUpdated")
      .withArgs(MIN_BET_AMOUNT, ethers.parseEther("150"))
    expect(await challenges.minBetAmount()).to.equal(ethers.parseEther("150"))
  })

  it("allows admin to withdraw all funds from a pending challenge", async function () {
    const { admin, alice, b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges)

    await expect(challenges.withdraw(alice.address, STAKE_AMOUNT))
      .to.emit(challenges, "AdminWithdrawal")
      .withArgs(admin.address, alice.address, STAKE_AMOUNT)

    expect(await b3tr.balanceOf(await challenges.getAddress())).to.equal(0n)
    expect(await b3tr.balanceOf(alice.address)).to.equal(INITIAL_BALANCE + STAKE_AMOUNT)
  })

  it("reverts withdraw when amount exceeds contract balance", async function () {
    const { admin, challenges } = await deployFixture()

    await expect(challenges.withdraw(admin.address, 1))
      .to.be.revertedWithCustomError(challenges, "InsufficientWithdrawableFunds")
      .withArgs(0, 1)
  })

  it("reverts settings setters with zero value", async function () {
    const { challenges } = await deployFixture()

    await expect(challenges.setMaxChallengeDuration(0)).to.be.revertedWithCustomError(challenges, "InvalidAmount")
    await expect(challenges.setMaxSelectedApps(0)).to.be.revertedWithCustomError(challenges, "InvalidAmount")
    await expect(challenges.setMaxParticipants(0)).to.be.revertedWithCustomError(challenges, "InvalidAmount")
    await expect(challenges.setMinBetAmount(0)).to.be.revertedWithCustomError(challenges, "InvalidAmount")
  })

  it("reverts admin functions from unauthorized callers", async function () {
    const { alice, challenges } = await deployFixture()

    await expect(challenges.connect(alice).setB3TRAddress(alice.address)).to.be.revertedWithCustomError(
      challenges,
      "ChallengesUnauthorizedUser",
    )
    await expect(challenges.connect(alice).setMaxChallengeDuration(10)).to.be.revertedWithCustomError(
      challenges,
      "ChallengesUnauthorizedUser",
    )
    await expect(challenges.connect(alice).setMinBetAmount(ethers.parseEther("150"))).to.be.revertedWithCustomError(
      challenges,
      "ChallengesUnauthorizedUser",
    )
    await expect(challenges.connect(alice).withdraw(alice.address, 1)).to.be.revertedWithCustomError(
      challenges,
      "ChallengesUnauthorizedUser",
    )
  })

  // ──── createChallenge edge cases ────

  it("rejects challenge with zero stake amount", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(createChallenge(challenges, { stakeAmount: 0n })).to.be.revertedWithCustomError(
      challenges,
      "InvalidAmount",
    )
  })

  it("rejects stake challenge below minimum bet amount", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)
    const belowMinimumBetAmount = ethers.parseEther("99")

    await expect(createChallenge(challenges, { stakeAmount: belowMinimumBetAmount }))
      .to.be.revertedWithCustomError(challenges, "BetAmountBelowMinimum")
      .withArgs(belowMinimumBetAmount, MIN_BET_AMOUNT)
  })

  it("auto-calculates startRound when set to 0", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(5)

    await createChallenge(challenges, { startRound: 0, endRound: 7 })

    const challenge = await challenges.getChallenge(1)
    expect(challenge.startRound).to.equal(6n)
  })

  it("rejects challenge exceeding max duration", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(createChallenge(challenges, { startRound: 2, endRound: 10 }))
      .to.be.revertedWithCustomError(challenges, "MaxChallengeDurationExceeded")
      .withArgs(9, 4)
  })

  it("rejects challenge with unknown app", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    const unknownApp = ethers.keccak256(ethers.toUtf8Bytes("unknown-app"))
    await expect(createChallenge(challenges, { appIds: [unknownApp] }))
      .to.be.revertedWithCustomError(challenges, "ChallengeUnknownApp")
      .withArgs(unknownApp)
  })

  it("rejects challenge with duplicate apps", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(createChallenge(challenges, { appIds: [APP_1, APP_1] }))
      .to.be.revertedWithCustomError(challenges, "DuplicateApp")
      .withArgs(APP_1)
  })

  it("does not auto-add creator for sponsored challenges", async function () {
    const { roundGovernor, challenges, alice } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      invitees: [alice.address],
    })

    const challenge = await challenges.getChallenge(1)
    expect(challenge.participantCount).to.equal(0n)
  })

  it("rejects sponsored challenge below minimum prize amount", async function () {
    const { roundGovernor, challenges, alice } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)
    const belowMinimumPrizeAmount = ethers.parseEther("99")

    await expect(
      createChallenge(challenges, {
        kind: ChallengeKind.Sponsored,
        visibility: ChallengeVisibility.Private,
        challengeType: ChallengeType.MaxActions,
        stakeAmount: belowMinimumPrizeAmount,
        invitees: [alice.address],
      }),
    )
      .to.be.revertedWithCustomError(challenges, "BetAmountBelowMinimum")
      .withArgs(belowMinimumPrizeAmount, MIN_BET_AMOUNT)
  })

  it("creates challenge with invitees at creation time", async function () {
    const { alice, bob, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      invitees: [alice.address, bob.address],
    })

    expect(await challenges.isInvitationEligible(1, alice.address)).to.equal(true)
    expect(await challenges.isInvitationEligible(1, bob.address)).to.equal(true)
    expect((await challenges.getChallenge(1)).invitedCount).to.equal(2n)
  })

  it("rejects inviting zero address", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(
      createChallenge(challenges, {
        kind: ChallengeKind.Sponsored,
        visibility: ChallengeVisibility.Private,
        challengeType: ChallengeType.MaxActions,
        invitees: [ethers.ZeroAddress],
      }),
    ).to.be.revertedWithCustomError(challenges, "ZeroAddress")
  })

  // ──── addInvites ────

  it("allows creator to add invites after creation", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
    })

    await challenges.addInvites(1, [alice.address])
    expect(await challenges.isInvitationEligible(1, alice.address)).to.equal(true)
    expect(await challenges.getParticipantStatus(1, alice.address)).to.equal(ParticipantStatus.Invited)
  })

  it("rejects duplicate invitees at creation time", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(
      createChallenge(challenges, {
        kind: ChallengeKind.Sponsored,
        visibility: ChallengeVisibility.Private,
        challengeType: ChallengeType.MaxActions,
        invitees: [alice.address, alice.address],
      }),
    )
      .to.be.revertedWithCustomError(challenges, "AlreadyInvited")
      .withArgs(1, alice.address)
  })

  it("rejects re-inviting an already invited user via addInvites", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      invitees: [alice.address],
    })

    await expect(challenges.addInvites(1, [alice.address]))
      .to.be.revertedWithCustomError(challenges, "AlreadyInvited")
      .withArgs(1, alice.address)
  })

  it("rejects addInvites from non-creator", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
    })

    await expect(challenges.connect(alice).addInvites(1, [alice.address])).to.be.revertedWithCustomError(
      challenges,
      "ChallengesUnauthorizedUser",
    )
  })

  it("silently skips re-inviting creator and already-joined participant", async function () {
    const { admin, alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      invitees: [alice.address],
    })

    await challenges.connect(alice).joinChallenge(1)
    await challenges.addInvites(1, [admin.address, alice.address])

    expect((await challenges.getChallenge(1)).participantCount).to.equal(1n)
  })

  // ──── joinChallenge edge cases ────

  it("rejects creator from joining own challenge", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
    })

    await expect(challenges.joinChallenge(1)).to.be.revertedWithCustomError(challenges, "CreatorCannotJoin")
  })

  it("rejects joining twice", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      invitees: [alice.address],
    })

    await challenges.connect(alice).joinChallenge(1)
    await expect(challenges.connect(alice).joinChallenge(1)).to.be.revertedWithCustomError(
      challenges,
      "AlreadyParticipating",
    )
  })

  it("rejects joining a private challenge without invitation", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
    })

    await expect(challenges.connect(alice).joinChallenge(1)).to.be.revertedWithCustomError(challenges, "NotInvited")
  })

  it("transfers stake when joining a stake challenge", async function () {
    const { alice, b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { invitees: [alice.address] })
    await challenges.connect(alice).joinChallenge(1)

    const challenge = await challenges.getChallenge(1)
    expect(challenge.totalPrize).to.equal(STAKE_AMOUNT * 2n)
    expect(await b3tr.balanceOf(alice.address)).to.equal(INITIAL_BALANCE - STAKE_AMOUNT)
  })

  it("rejects joining after challenge start round", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      invitees: [alice.address],
    })

    await roundGovernor.setCurrentRoundId(2)

    await expect(challenges.connect(alice).joinChallenge(1)).to.be.revertedWithCustomError(
      challenges,
      "ChallengeNotPending",
    )
  })

  // ──── leaveChallenge ────

  it("allows participant to leave a pending stake challenge and get refund", async function () {
    const { alice, b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { invitees: [alice.address] })
    await challenges.connect(alice).joinChallenge(1)

    await challenges.connect(alice).leaveChallenge(1)

    expect(await challenges.getParticipantStatus(1, alice.address)).to.equal(ParticipantStatus.Invited)
    expect(await b3tr.balanceOf(alice.address)).to.equal(INITIAL_BALANCE)
    expect((await challenges.getChallenge(1)).totalPrize).to.equal(STAKE_AMOUNT)
  })

  it("rejects creator from leaving own challenge", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges)

    await expect(challenges.leaveChallenge(1)).to.be.revertedWithCustomError(challenges, "CreatorCannotLeave")
  })

  it("rejects leaving when not participating", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
    })

    await expect(challenges.connect(alice).leaveChallenge(1)).to.be.revertedWithCustomError(
      challenges,
      "NotParticipating",
    )
  })

  it("reverts back to invited status when leaving a private challenge", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      invitees: [alice.address],
    })

    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(alice).leaveChallenge(1)

    expect(await challenges.getParticipantStatus(1, alice.address)).to.equal(ParticipantStatus.Invited)
    expect(await challenges.isInvitationEligible(1, alice.address)).to.equal(true)
  })

  // ──── declineChallenge edge cases ────

  it("rejects decline from creator", async function () {
    const { admin, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      invitees: [admin.address],
    })

    await expect(challenges.declineChallenge(1)).to.be.revertedWithCustomError(challenges, "ChallengesUnauthorizedUser")
  })

  it("rejects decline from non-invited user", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
    })

    await expect(challenges.connect(alice).declineChallenge(1)).to.be.revertedWithCustomError(challenges, "NotInvited")
  })

  it("refunds stake when an invited joined user declines a stake challenge", async function () {
    const { alice, b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { invitees: [alice.address] })

    await challenges.connect(alice).joinChallenge(1)
    expect(await b3tr.balanceOf(alice.address)).to.equal(INITIAL_BALANCE - STAKE_AMOUNT)

    await challenges.connect(alice).declineChallenge(1)

    expect(await b3tr.balanceOf(alice.address)).to.equal(INITIAL_BALANCE)
    expect(await challenges.getParticipantStatus(1, alice.address)).to.equal(ParticipantStatus.Declined)
    expect((await challenges.getChallenge(1)).totalPrize).to.equal(STAKE_AMOUNT)
  })

  // ──── cancelChallenge edge cases ────

  it("rejects cancel from non-creator", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges)

    await expect(challenges.connect(alice).cancelChallenge(1)).to.be.revertedWithCustomError(
      challenges,
      "ChallengesUnauthorizedUser",
    )
  })

  it("rejects cancel on non-pending challenge", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges)
    await challenges.cancelChallenge(1)

    await expect(challenges.cancelChallenge(1)).to.be.revertedWithCustomError(challenges, "ChallengeNotPending")
  })

  // ──── syncChallenge edge cases ────

  it("sync returns current status for already-synced challenge", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges)
    await challenges.cancelChallenge(1)

    expect(await challenges.getChallengeStatus(1)).to.equal(ChallengeStatus.Cancelled)
  })

  it("sync returns Pending if current round < start round", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { startRound: 5, endRound: 5 })
    await roundGovernor.setCurrentRoundId(3)

    expect(await challenges.getChallengeStatus(1)).to.equal(ChallengeStatus.Pending)
  })

  it("sponsored challenge with 1 participant is valid at sync", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      invitees: [alice.address],
      endRound: 2,
    })

    await challenges.connect(alice).joinChallenge(1)
    await roundGovernor.setCurrentRoundId(2)

    await challenges.syncChallenge(1)
    expect(await challenges.getChallengeStatus(1)).to.equal(ChallengeStatus.Active)
  })

  it("sponsored challenge with 0 participants is invalid at sync", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      endRound: 2,
    })

    await roundGovernor.setCurrentRoundId(2)
    await challenges.syncChallenge(1)
    expect(await challenges.getChallengeStatus(1)).to.equal(ChallengeStatus.Invalid)
  })

  // ──── completeChallenge edge cases ────

  it("rejects complete before challenge ends", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { invitees: [alice.address] })
    await challenges.connect(alice).joinChallenge(1)

    await expect(challenges.completeChallenge(1)).to.be.revertedWithCustomError(challenges, "ChallengeNotEnded")
  })

  it("rejects complete on cancelled challenge", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { invitees: [alice.address] })
    await challenges.connect(alice).joinChallenge(1)
    await challenges.cancelChallenge(1)
    await roundGovernor.setCurrentRoundId(4)

    await expect(challenges.completeChallenge(1)).to.be.revertedWithCustomError(challenges, "ChallengeInvalidStatus")
  })

  it("rejects complete on already-completed challenge", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { invitees: [alice.address] })
    await challenges.connect(alice).joinChallenge(1)
    await roundGovernor.setCurrentRoundId(4)

    await challenges.completeChallenge(1)

    await expect(challenges.completeChallenge(1)).to.be.revertedWithCustomError(challenges, "ChallengeAlreadyCompleted")
  })

  it("rejects complete on invalid challenge", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { endRound: 2 })
    await roundGovernor.setCurrentRoundId(3)

    await expect(challenges.completeChallenge(1)).to.be.revertedWithCustomError(challenges, "ChallengeInvalidStatus")
  })

  // ──── claimChallengePayout edge cases ────

  it("rejects payout claim on non-completed challenge", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { invitees: [alice.address] })
    await challenges.connect(alice).joinChallenge(1)

    await expect(challenges.claimChallengePayout(1)).to.be.revertedWithCustomError(challenges, "ChallengeInvalidStatus")
  })

  it("rejects double payout claim", async function () {
    const { alice, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { endRound: 2, invitees: [alice.address] })
    await challenges.connect(alice).joinChallenge(1)

    await passport.setUserRoundActionCountApp(alice.address, 2, APP_1, 10)
    await roundGovernor.setCurrentRoundId(3)
    await challenges.completeChallenge(1)

    await challenges.connect(alice).claimChallengePayout(1)

    await expect(challenges.connect(alice).claimChallengePayout(1)).to.be.revertedWithCustomError(
      challenges,
      "AlreadyClaimed",
    )
  })

  it("gives dust remainder to the last claimer with 3 winners", async function () {
    const { admin, alice, bob, b3tr, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    const stakeAmount = ethers.parseEther("100")
    await createChallenge(challenges, { stakeAmount, endRound: 2, invitees: [alice.address, bob.address] })
    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)

    await passport.setUserRoundActionCountApp(admin.address, 2, APP_1, 5)
    await passport.setUserRoundActionCountApp(alice.address, 2, APP_1, 5)
    await passport.setUserRoundActionCountApp(bob.address, 2, APP_1, 5)

    await roundGovernor.setCurrentRoundId(3)
    await challenges.completeChallenge(1)

    const totalPrize = stakeAmount * 3n
    const baseShare = totalPrize / 3n

    await challenges.claimChallengePayout(1)
    await challenges.connect(alice).claimChallengePayout(1)
    await challenges.connect(bob).claimChallengePayout(1)

    const lastClaimerBalance = await b3tr.balanceOf(bob.address)
    const remainder = totalPrize - baseShare * 2n
    expect(lastClaimerBalance).to.equal(INITIAL_BALANCE - stakeAmount + remainder)
  })

  // ──── claimChallengeRefund edge cases ────

  it("rejects refund on active challenge", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { invitees: [alice.address] })
    await challenges.connect(alice).joinChallenge(1)
    await roundGovernor.setCurrentRoundId(2)
    await challenges.syncChallenge(1)

    await expect(challenges.claimChallengeRefund(1)).to.be.revertedWithCustomError(challenges, "ChallengeInvalidStatus")
  })

  it("rejects double refund", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { endRound: 2 })
    await roundGovernor.setCurrentRoundId(2)
    await challenges.syncChallenge(1)

    await challenges.claimChallengeRefund(1)

    await expect(challenges.claimChallengeRefund(1)).to.be.revertedWithCustomError(challenges, "AlreadyRefunded")
  })

  it("rejects refund for non-participant on cancelled stake challenge", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges)
    await challenges.cancelChallenge(1)

    await expect(challenges.connect(alice).claimChallengeRefund(1)).to.be.revertedWithCustomError(
      challenges,
      "NothingToRefund",
    )
  })

  it("only refunds creator for cancelled sponsored challenge", async function () {
    const { admin, alice, b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      invitees: [alice.address],
    })

    await challenges.connect(alice).joinChallenge(1)
    await challenges.cancelChallenge(1)

    await expect(challenges.connect(alice).claimChallengeRefund(1)).to.be.revertedWithCustomError(
      challenges,
      "NothingToRefund",
    )

    await challenges.claimChallengeRefund(1)
    expect(await b3tr.balanceOf(admin.address)).to.equal(INITIAL_BALANCE)
  })

  it("auto-syncs pending challenge when claiming refund", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { endRound: 2 })
    await roundGovernor.setCurrentRoundId(2)

    await challenges.claimChallengeRefund(1)
    expect(await challenges.getChallengeStatus(1)).to.equal(ChallengeStatus.Invalid)
  })

  // ──── Re-invite a previously declined user ────

  it("re-inviting a declined user moves them back to invited", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      invitees: [alice.address],
    })

    await challenges.connect(alice).declineChallenge(1)
    expect(await challenges.getParticipantStatus(1, alice.address)).to.equal(ParticipantStatus.Declined)

    await challenges.addInvites(1, [alice.address])
    expect(await challenges.getParticipantStatus(1, alice.address)).to.equal(ParticipantStatus.Invited)
    expect((await challenges.getChallenge(1)).declinedCount).to.equal(0n)
  })

  // ──── Non-existent challenge operations ────

  it("rejects operations on non-existent challenges", async function () {
    const { challenges } = await deployFixture()

    await expect(challenges.joinChallenge(99)).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
    await expect(challenges.leaveChallenge(99)).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
    await expect(challenges.declineChallenge(99)).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
    await expect(challenges.cancelChallenge(99)).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
    await expect(challenges.syncChallenge(99)).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
    await expect(challenges.completeChallenge(99)).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
    await expect(challenges.claimChallengePayout(99)).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
    await expect(challenges.claimSplitWinPrize(99)).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
    await expect(challenges.claimCreatorSplitWinRefund(99)).to.be.revertedWithCustomError(
      challenges,
      "ChallengeDoesNotExist",
    )
    await expect(challenges.claimChallengeRefund(99)).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
    await expect(challenges.addInvites(99, [])).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
    await expect(challenges.getParticipantActions(99, ethers.ZeroAddress)).to.be.revertedWithCustomError(
      challenges,
      "ChallengeDoesNotExist",
    )
  })

  // ──── Leaving sponsored challenge (no token refund) ────

  it("allows leaving a sponsored challenge without token refund", async function () {
    const { alice, b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      invitees: [alice.address],
    })

    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(alice).leaveChallenge(1)

    expect(await b3tr.balanceOf(alice.address)).to.equal(INITIAL_BALANCE)
    expect((await challenges.getChallenge(1)).participantCount).to.equal(0n)
  })
})
