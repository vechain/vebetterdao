import { expect } from "chai"
import { ethers } from "hardhat"
import { deployProxy } from "../../scripts/helpers"
import { B3TR, B3TRChallenges, MockPassportActions, MockRoundGovernor, MockX2EarnApps } from "../../typechain-types"

const STAKE_AMOUNT = ethers.parseEther("100")
const INITIAL_BALANCE = ethers.parseEther("1000")
const APP_1 = ethers.keccak256(ethers.toUtf8Bytes("app-1"))
const APP_2 = ethers.keccak256(ethers.toUtf8Bytes("app-2"))
const APP_3 = ethers.keccak256(ethers.toUtf8Bytes("app-3"))
const APP_4 = ethers.keccak256(ethers.toUtf8Bytes("app-4"))
const APP_5 = ethers.keccak256(ethers.toUtf8Bytes("app-5"))
const APP_6 = ethers.keccak256(ethers.toUtf8Bytes("app-6"))

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
  Finalizing: 2,
  Finalized: 3,
  Cancelled: 4,
  Invalid: 5,
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

  for (const appId of [APP_1, APP_2, APP_3, APP_4, APP_5, APP_6]) {
    await x2EarnApps.setAppExists(appId, true)
  }

  const challenges = (await deployProxy("B3TRChallenges", [
    {
      b3trAddress: await b3tr.getAddress(),
      veBetterPassportAddress: await passport.getAddress(),
      xAllocationVotingAddress: await roundGovernor.getAddress(),
      x2EarnAppsAddress: await x2EarnApps.getAddress(),
      maxChallengeDuration: 4,
      maxSelectedApps: 5,
      maxParticipants,
    },
    {
      admin: admin.address,
      upgrader: admin.address,
      contractsAddressManager: admin.address,
      settingsManager: admin.address,
    },
  ])) as B3TRChallenges

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
    ...overrides,
  })
}

describe("B3TRChallenges - @shard9a", function () {
  it("creates a stake challenge and auto-adds the creator", async function () {
    const { admin, b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges)

    const challenge = await challenges.getChallenge(1)

    expect(challenge.creator).to.equal(admin.address)
    expect(challenge.participantCount).to.equal(1n)
    expect(challenge.totalPrize).to.equal(STAKE_AMOUNT)
    expect(await challenges.getParticipantStatus(1, admin.address)).to.equal(ParticipantStatus.Joined)
    expect(await b3tr.balanceOf(await challenges.getAddress())).to.equal(STAKE_AMOUNT)
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

  it("counts the creator toward the participant cap for stake challenges", async function () {
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

  it("marks an unjoined stake challenge invalid and refunds the creator", async function () {
    const { admin, b3tr, roundGovernor, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await createChallenge(challenges, { endRound: 2 })
    await roundGovernor.setCurrentRoundId(2)

    await challenges.syncChallenge(1)
    expect(await challenges.getChallengeStatus(1)).to.equal(ChallengeStatus.Invalid)

    await challenges.claimChallengeRefund(1)

    expect(await b3tr.balanceOf(admin.address)).to.equal(INITIAL_BALANCE)
  })

  it("cancels a stake challenge and refunds creator and participant", async function () {
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

  it("finalizes in batches and splits the stake pot between tied winners", async function () {
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

    await challenges.finalizeChallengeBatch(1, 2)
    expect(await challenges.getChallengeStatus(1)).to.equal(ChallengeStatus.Finalizing)
    await challenges.finalizeChallengeBatch(1, 2)

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
    await challenges.finalizeChallengeBatch(1, 10)

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
    await challenges.finalizeChallengeBatch(1, 10)

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
})
