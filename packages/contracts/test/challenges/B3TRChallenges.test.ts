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

const ThresholdMode = {
  None: 0,
  SplitAboveThreshold: 1,
  TopAboveThreshold: 2,
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
  Finalized: 2,
  Cancelled: 3,
  Invalid: 4,
} as const

const SettlementMode = {
  None: 0,
  TopWinners: 1,
  QualifiedSplit: 2,
  CreatorRefund: 3,
} as const

async function deployFixture({ maxParticipants = 100 }: { maxParticipants?: number } = {}) {
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
        minBetAmount: MIN_BET_AMOUNT,
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

async function createChallenge(
  challenges: B3TRChallenges,
  overrides: Partial<Parameters<B3TRChallenges["createChallenge"]>[0]> = {},
) {
  return challenges.createChallenge({
    kind: ChallengeKind.Stake,
    visibility: ChallengeVisibility.Public,
    thresholdMode: ThresholdMode.None,
    stakeAmount: STAKE_AMOUNT,
    startRound: 2,
    endRound: 3,
    threshold: 0,
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
  it("creates a challenge and auto-adds the creator", async function () {
    const { admin, b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    const tx = await createChallenge(challenges)
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
    expect(challengeCreated?.args.visibility).to.equal(ChallengeVisibility.Public)
    expect(challengeCreated?.args.thresholdMode).to.equal(ThresholdMode.None)
    expect(challengeCreated?.args.stakeAmount).to.equal(STAKE_AMOUNT)
    expect(challengeCreated?.args.startRound).to.equal(2n)
    expect(challengeCreated?.args.threshold).to.equal(0n)
    expect(challengeCreated?.args.allApps).to.equal(false)
    expect(challengeCreated?.args.selectedApps).to.deep.equal([APP_1])
    expect(challengeCreated?.args.title).to.equal("")
    expect(challengeCreated?.args.description).to.equal("")
    expect(challengeCreated?.args.imageURI).to.equal("")
    expect(challengeCreated?.args.metadataURI).to.equal("")

    const challenge = await challenges.getChallenge(1)

    expect(challenge.creator).to.equal(admin.address)
    expect(challenge.participantCount).to.equal(1n)
    expect(challenge.totalPrize).to.equal(STAKE_AMOUNT)
    expect(await challenges.getParticipantStatus(1, admin.address)).to.equal(ParticipantStatus.Joined)
    expect(await b3tr.balanceOf(await challenges.getAddress())).to.equal(STAKE_AMOUNT)
  })

  it("stores title and defaults the other metadata fields to empty strings", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      title: "Spring Sprint",
    })

    const challenge = await challenges.getChallenge(1)
    expect(challenge.title).to.equal("Spring Sprint")
    expect(challenge.description).to.equal("")
    expect(challenge.imageURI).to.equal("")
    expect(challenge.metadataURI).to.equal("")
  })

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

  it("rejects joining a sponsored challenge after reaching the participant cap", async function () {
    const { alice, bob, carol, roundGovernor, challenges } = await deployFixture({ maxParticipants: 2 })
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      thresholdMode: ThresholdMode.None,
    })

    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)

    await expect(challenges.connect(carol).joinChallenge(1))
      .to.be.revertedWithCustomError(challenges, "MaxParticipantsExceeded")
      .withArgs(3, 2)
  })

  it("counts the creator toward the participant cap", async function () {
    const { alice, bob, carol, roundGovernor, challenges } = await deployFixture({ maxParticipants: 3 })
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges)
    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)

    await expect(challenges.connect(carol).joinChallenge(1))
      .to.be.revertedWithCustomError(challenges, "MaxParticipantsExceeded")
      .withArgs(4, 3)
  })

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

    await createChallenge(challenges, {
      appIds: [APP_1, APP_2, APP_3, APP_4, APP_5],
    })

    const challenge = await challenges.getChallenge(1)
    expect(challenge.allApps).to.equal(false)
    expect(challenge.selectedAppsCount).to.equal(5n)
  })

  it("rejects challenges with more than five selected apps", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(
      createChallenge(challenges, {
        appIds: [APP_1, APP_2, APP_3, APP_4, APP_5, APP_6],
      }),
    )
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

  it("lets an invited user decline and later join a private sponsored challenge", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      thresholdMode: ThresholdMode.None,
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

  it("marks an unjoined challenge invalid and refunds the creator", async function () {
    const { admin, b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { endRound: 2 })
    await roundGovernor.setCurrentRoundId(2)

    await challenges.syncChallenge(1)
    expect(await challenges.getChallengeStatus(1)).to.equal(ChallengeStatus.Invalid)

    await challenges.claimChallengeRefund(1)

    expect(await b3tr.balanceOf(admin.address)).to.equal(INITIAL_BALANCE)
  })

  it("cancels a challenge and refunds creator and participant", async function () {
    const { admin, alice, b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges)
    await challenges.connect(alice).joinChallenge(1)
    await challenges.cancelChallenge(1)

    await challenges.claimChallengeRefund(1)
    await challenges.connect(alice).claimChallengeRefund(1)

    expect(await b3tr.balanceOf(admin.address)).to.equal(INITIAL_BALANCE)
    expect(await b3tr.balanceOf(alice.address)).to.equal(INITIAL_BALANCE)
  })

  it("finalizes and splits the stake pot between tied winners", async function () {
    const { admin, alice, bob, b3tr, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { appIds: [APP_1, APP_2], endRound: 3 })
    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)

    await passport.setUserRoundActionCountApp(admin.address, 2, APP_1, 1)
    await passport.setUserRoundActionCountApp(alice.address, 2, APP_1, 2)
    await passport.setUserRoundActionCountApp(alice.address, 3, APP_2, 3)
    await passport.setUserRoundActionCountApp(bob.address, 2, APP_1, 4)
    await passport.setUserRoundActionCountApp(bob.address, 3, APP_2, 1)

    await roundGovernor.setCurrentRoundId(4)

    await challenges.finalizeChallenge(1)

    const challenge = await challenges.getChallenge(1)
    expect(challenge.status).to.equal(ChallengeStatus.Finalized)
    expect(challenge.bestScore).to.equal(5n)
    expect(challenge.bestCount).to.equal(2n)
    expect(challenge.settlementMode).to.equal(SettlementMode.TopWinners)

    await expect(challenges.claimChallengePayout(1)).to.be.revertedWithCustomError(challenges, "NothingToClaim")

    await challenges.connect(alice).claimChallengePayout(1)
    await challenges.connect(bob).claimChallengePayout(1)

    expect(await b3tr.balanceOf(alice.address)).to.equal(INITIAL_BALANCE + ethers.parseEther("50"))
    expect(await b3tr.balanceOf(bob.address)).to.equal(INITIAL_BALANCE + ethers.parseEther("50"))
  })

  it("refunds the sponsor when nobody reaches the threshold in all-apps mode", async function () {
    const { admin, b3tr, alice, bob, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      thresholdMode: ThresholdMode.SplitAboveThreshold,
      appIds: [],
      threshold: 10,
      endRound: 3,
    })

    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)

    await passport.setUserRoundActionCount(alice.address, 2, 3)
    await passport.setUserRoundActionCount(alice.address, 3, 2)
    await passport.setUserRoundActionCount(bob.address, 2, 4)
    await passport.setUserRoundActionCount(bob.address, 3, 1)

    await roundGovernor.setCurrentRoundId(4)
    await challenges.finalizeChallenge(1)

    const challenge = await challenges.getChallenge(1)
    expect(challenge.settlementMode).to.equal(SettlementMode.CreatorRefund)

    await challenges.claimChallengePayout(1)
    expect(await b3tr.balanceOf(admin.address)).to.equal(INITIAL_BALANCE)
  })

  it("awards the sponsored prize to the best threshold-qualified participant on selected apps", async function () {
    const { admin, alice, bob, b3tr, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      thresholdMode: ThresholdMode.TopAboveThreshold,
      appIds: [APP_1],
      threshold: 5,
      endRound: 3,
    })

    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)

    await passport.setUserRoundActionCountApp(alice.address, 2, APP_1, 3)
    await passport.setUserRoundActionCountApp(alice.address, 3, APP_1, 3)
    await passport.setUserRoundActionCountApp(alice.address, 2, APP_2, 100)
    await passport.setUserRoundActionCountApp(bob.address, 2, APP_1, 4)
    await passport.setUserRoundActionCountApp(bob.address, 3, APP_1, 4)

    await roundGovernor.setCurrentRoundId(4)
    await challenges.finalizeChallenge(1)

    const challenge = await challenges.getChallenge(1)
    expect(challenge.bestScore).to.equal(8n)
    expect(challenge.bestCount).to.equal(1n)

    await expect(challenges.connect(alice).claimChallengePayout(1)).to.be.revertedWithCustomError(
      challenges,
      "NothingToClaim",
    )

    await challenges.connect(bob).claimChallengePayout(1)

    expect(await b3tr.balanceOf(bob.address)).to.equal(INITIAL_BALANCE + STAKE_AMOUNT)
    expect(await b3tr.balanceOf(admin.address)).to.equal(INITIAL_BALANCE - STAKE_AMOUNT)
  })

  it("splits the sponsored prize among all participants who reach the threshold", async function () {
    const { admin, alice, bob, b3tr, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      thresholdMode: ThresholdMode.SplitAboveThreshold,
      appIds: [],
      threshold: 5,
      endRound: 3,
    })

    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)

    // Both alice and bob reach threshold (>= 5)
    await passport.setUserRoundActionCount(alice.address, 2, 3)
    await passport.setUserRoundActionCount(alice.address, 3, 4) // total: 7
    await passport.setUserRoundActionCount(bob.address, 2, 2)
    await passport.setUserRoundActionCount(bob.address, 3, 3) // total: 5

    await roundGovernor.setCurrentRoundId(4)
    await challenges.finalizeChallenge(1)

    const challenge = await challenges.getChallenge(1)
    expect(challenge.settlementMode).to.equal(SettlementMode.QualifiedSplit)
    expect(challenge.qualifiedCount).to.equal(2n)

    // Creator cannot claim
    await expect(challenges.claimChallengePayout(1)).to.be.revertedWithCustomError(challenges, "NothingToClaim")

    await challenges.connect(alice).claimChallengePayout(1)
    await challenges.connect(bob).claimChallengePayout(1)

    expect(await b3tr.balanceOf(alice.address)).to.equal(INITIAL_BALANCE + ethers.parseEther("50"))
    expect(await b3tr.balanceOf(bob.address)).to.equal(INITIAL_BALANCE + ethers.parseEther("50"))
    expect(await b3tr.balanceOf(admin.address)).to.equal(INITIAL_BALANCE - STAKE_AMOUNT)
  })

  it("only pays qualified participants when some fall below the threshold", async function () {
    const { admin, alice, bob, b3tr, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      thresholdMode: ThresholdMode.SplitAboveThreshold,
      appIds: [],
      threshold: 5,
      endRound: 2,
    })

    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)

    await passport.setUserRoundActionCount(alice.address, 2, 6) // qualifies
    await passport.setUserRoundActionCount(bob.address, 2, 3) // does NOT qualify

    await roundGovernor.setCurrentRoundId(3)
    await challenges.finalizeChallenge(1)

    const challenge = await challenges.getChallenge(1)
    expect(challenge.settlementMode).to.equal(SettlementMode.QualifiedSplit)
    expect(challenge.qualifiedCount).to.equal(1n)

    await expect(challenges.connect(bob).claimChallengePayout(1)).to.be.revertedWithCustomError(
      challenges,
      "NothingToClaim",
    )

    await challenges.connect(alice).claimChallengePayout(1)
    expect(await b3tr.balanceOf(alice.address)).to.equal(INITIAL_BALANCE + STAKE_AMOUNT)
  })

  it("rejects sponsored challenge with threshold > 0 and ThresholdMode.None", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(
      createChallenge(challenges, {
        kind: ChallengeKind.Sponsored,
        thresholdMode: ThresholdMode.None,
        threshold: 5,
        appIds: [],
      }),
    ).to.be.revertedWithCustomError(challenges, "InvalidThresholdConfiguration")
  })

  it("rejects sponsored challenge with threshold 0 and SplitAboveThreshold mode", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(
      createChallenge(challenges, {
        kind: ChallengeKind.Sponsored,
        thresholdMode: ThresholdMode.SplitAboveThreshold,
        threshold: 0,
        appIds: [],
      }),
    ).to.be.revertedWithCustomError(challenges, "InvalidThresholdConfiguration")
  })

  it("rejects stake challenge with a threshold", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(
      createChallenge(challenges, {
        kind: ChallengeKind.Stake,
        thresholdMode: ThresholdMode.SplitAboveThreshold,
        threshold: 5,
      }),
    ).to.be.revertedWithCustomError(challenges, "InvalidThresholdConfiguration")
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
      thresholdMode: ThresholdMode.None,
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

    await createChallenge(challenges, { appIds: [APP_1], endRound: 2 })
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
    await expect(challenges.getParticipantStatus(0, admin.address)).to.be.revertedWithCustomError(
      challenges,
      "ChallengeDoesNotExist",
    )
    await expect(challenges.isInvitationEligible(0, admin.address)).to.be.revertedWithCustomError(
      challenges,
      "ChallengeDoesNotExist",
    )
    await expect(challenges.getChallengeStatus(0)).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
  })

  // ──── Admin setters ────

  it("updates address setters and emits events", async function () {
    const { admin, alice, challenges } = await deployFixture()

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

  it("enforces the updated minimum bet amount", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)
    await challenges.setMinBetAmount(ethers.parseEther("150"))

    await expect(createChallenge(challenges))
      .to.be.revertedWithCustomError(challenges, "BetAmountBelowMinimum")
      .withArgs(STAKE_AMOUNT, ethers.parseEther("150"))
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
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      thresholdMode: ThresholdMode.None,
    })

    const challenge = await challenges.getChallenge(1)
    expect(challenge.participantCount).to.equal(0n)
  })

  it("rejects sponsored challenge below minimum prize amount", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)
    const belowMinimumPrizeAmount = ethers.parseEther("99")

    await expect(
      createChallenge(challenges, {
        kind: ChallengeKind.Sponsored,
        thresholdMode: ThresholdMode.None,
        stakeAmount: belowMinimumPrizeAmount,
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
      thresholdMode: ThresholdMode.None,
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
        thresholdMode: ThresholdMode.None,
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
      thresholdMode: ThresholdMode.None,
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
        thresholdMode: ThresholdMode.None,
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
      thresholdMode: ThresholdMode.None,
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
      thresholdMode: ThresholdMode.None,
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
      thresholdMode: ThresholdMode.None,
      invitees: [alice.address],
    })

    await challenges.connect(alice).joinChallenge(1)

    // Re-inviting creator and already-joined user should not revert
    await challenges.addInvites(1, [admin.address, alice.address])

    expect((await challenges.getChallenge(1)).participantCount).to.equal(1n)
  })

  // ──── joinChallenge edge cases ────

  it("rejects creator from joining own challenge", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      thresholdMode: ThresholdMode.None,
    })

    await expect(challenges.joinChallenge(1)).to.be.revertedWithCustomError(challenges, "CreatorCannotJoin")
  })

  it("rejects joining twice", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      thresholdMode: ThresholdMode.None,
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
      thresholdMode: ThresholdMode.None,
    })

    await expect(challenges.connect(alice).joinChallenge(1)).to.be.revertedWithCustomError(challenges, "NotInvited")
  })

  it("transfers stake when joining a stake challenge", async function () {
    const { alice, b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges)
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
      thresholdMode: ThresholdMode.None,
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

    await createChallenge(challenges)
    await challenges.connect(alice).joinChallenge(1)

    await challenges.connect(alice).leaveChallenge(1)

    expect(await challenges.getParticipantStatus(1, alice.address)).to.equal(ParticipantStatus.None)
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
      thresholdMode: ThresholdMode.None,
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
      thresholdMode: ThresholdMode.None,
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
      thresholdMode: ThresholdMode.None,
      invitees: [admin.address],
    })

    await expect(challenges.declineChallenge(1)).to.be.revertedWithCustomError(challenges, "ChallengesUnauthorizedUser")
  })

  it("rejects decline from non-invited user", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      thresholdMode: ThresholdMode.None,
    })

    await expect(challenges.connect(alice).declineChallenge(1)).to.be.revertedWithCustomError(challenges, "NotInvited")
  })

  it("refunds stake when an invited joined user declines a stake challenge", async function () {
    const { alice, b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      invitees: [alice.address],
    })

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

    // syncing a cancelled challenge returns Cancelled without changing it
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
      thresholdMode: ThresholdMode.None,
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
      thresholdMode: ThresholdMode.None,
      endRound: 2,
    })

    await roundGovernor.setCurrentRoundId(2)
    await challenges.syncChallenge(1)
    expect(await challenges.getChallengeStatus(1)).to.equal(ChallengeStatus.Invalid)
  })

  // ──── finalizeChallenge edge cases ────

  it("rejects finalize before challenge ends", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges)
    await challenges.connect(alice).joinChallenge(1)

    await expect(challenges.finalizeChallenge(1)).to.be.revertedWithCustomError(challenges, "ChallengeNotEnded")
  })

  it("rejects finalize on cancelled challenge", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges)
    await challenges.connect(alice).joinChallenge(1)
    await challenges.cancelChallenge(1)
    await roundGovernor.setCurrentRoundId(4)

    await expect(challenges.finalizeChallenge(1)).to.be.revertedWithCustomError(challenges, "ChallengeInvalidStatus")
  })

  it("rejects finalize on already-finalized challenge", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges)
    await challenges.connect(alice).joinChallenge(1)
    await roundGovernor.setCurrentRoundId(4)

    await challenges.finalizeChallenge(1)

    await expect(challenges.finalizeChallenge(1)).to.be.revertedWithCustomError(challenges, "ChallengeAlreadyFinalized")
  })

  it("rejects finalize on invalid challenge", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { endRound: 2 })
    await roundGovernor.setCurrentRoundId(3)

    await expect(challenges.finalizeChallenge(1)).to.be.revertedWithCustomError(challenges, "ChallengeInvalidStatus")
  })

  // ──── claimChallengePayout edge cases ────

  it("rejects payout claim on non-finalized challenge", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges)
    await challenges.connect(alice).joinChallenge(1)

    await expect(challenges.claimChallengePayout(1)).to.be.revertedWithCustomError(challenges, "ChallengeInvalidStatus")
  })

  it("rejects double payout claim", async function () {
    const { alice, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { endRound: 2 })
    await challenges.connect(alice).joinChallenge(1)

    await passport.setUserRoundActionCountApp(alice.address, 2, APP_1, 10)
    await roundGovernor.setCurrentRoundId(3)
    await challenges.finalizeChallenge(1)

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
    await createChallenge(challenges, { stakeAmount, endRound: 2 })
    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)

    await passport.setUserRoundActionCountApp(admin.address, 2, APP_1, 5)
    await passport.setUserRoundActionCountApp(alice.address, 2, APP_1, 5)
    await passport.setUserRoundActionCountApp(bob.address, 2, APP_1, 5)

    await roundGovernor.setCurrentRoundId(3)
    await challenges.finalizeChallenge(1)

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

    await createChallenge(challenges)
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
      thresholdMode: ThresholdMode.None,
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
    const { b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { endRound: 2 })
    await roundGovernor.setCurrentRoundId(2)

    // claimChallengeRefund auto-syncs to Invalid, then refunds
    await challenges.claimChallengeRefund(1)
    expect(await challenges.getChallengeStatus(1)).to.equal(ChallengeStatus.Invalid)
  })

  // ──── TopAboveThreshold: creator refund when nobody qualifies ────

  it("refunds creator in TopAboveThreshold mode when nobody reaches threshold", async function () {
    const { admin, alice, b3tr, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      thresholdMode: ThresholdMode.TopAboveThreshold,
      appIds: [APP_1],
      threshold: 20,
      endRound: 2,
    })

    await challenges.connect(alice).joinChallenge(1)
    await passport.setUserRoundActionCountApp(alice.address, 2, APP_1, 5)

    await roundGovernor.setCurrentRoundId(3)
    await challenges.finalizeChallenge(1)

    const challenge = await challenges.getChallenge(1)
    expect(challenge.settlementMode).to.equal(SettlementMode.CreatorRefund)
    expect(challenge.bestCount).to.equal(0n)

    await challenges.claimChallengePayout(1)
    expect(await b3tr.balanceOf(admin.address)).to.equal(INITIAL_BALANCE)
  })

  // ──── Stake challenge with ThresholdMode.None but threshold=0 is valid ────

  it("rejects stake challenge with non-None threshold mode even with threshold 0", async function () {
    const { roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await expect(
      createChallenge(challenges, {
        kind: ChallengeKind.Stake,
        thresholdMode: ThresholdMode.TopAboveThreshold,
        threshold: 0,
      }),
    ).to.be.revertedWithCustomError(challenges, "InvalidThresholdConfiguration")
  })

  // ──── Re-invite a previously declined user ────

  it("re-inviting a declined user moves them back to invited", async function () {
    const { alice, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      thresholdMode: ThresholdMode.None,
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
    await expect(challenges.finalizeChallenge(99)).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
    await expect(challenges.claimChallengePayout(99)).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
    await expect(challenges.claimChallengeRefund(99)).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
    await expect(challenges.addInvites(99, [])).to.be.revertedWithCustomError(challenges, "ChallengeDoesNotExist")
    await expect(challenges.getParticipantActions(99, ethers.ZeroAddress)).to.be.revertedWithCustomError(
      challenges,
      "ChallengeDoesNotExist",
    )
  })

  // ──── Leaving sponsored challenge (no refund) ────

  it("allows leaving a sponsored challenge without token refund", async function () {
    const { alice, b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, {
      kind: ChallengeKind.Sponsored,
      thresholdMode: ThresholdMode.None,
    })

    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(alice).leaveChallenge(1)

    expect(await b3tr.balanceOf(alice.address)).to.equal(INITIAL_BALANCE)
    expect((await challenges.getChallenge(1)).participantCount).to.equal(0n)
  })
})
