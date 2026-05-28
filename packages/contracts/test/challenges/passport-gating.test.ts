import { expect } from "chai"
import { ethers } from "hardhat"
import { deployProxy } from "../../scripts/helpers"
import { challengesLibraries } from "../../scripts/libraries"
import { B3TR, B3TRChallenges, MockPassportActions, MockRoundGovernor, MockX2EarnApps } from "../../typechain-types"

const STAKE_AMOUNT = ethers.parseEther("100")
const MIN_BET_AMOUNT = ethers.parseEther("100")
const INITIAL_BALANCE = ethers.parseEther("1000")
const APP_1 = ethers.keccak256(ethers.toUtf8Bytes("app-1"))

const ChallengeKind = { Stake: 0, Sponsored: 1 } as const
const ChallengeVisibility = { Public: 0, Private: 1 } as const
const ChallengeType = { MaxActions: 0, SplitWin: 1 } as const
const ChallengeStatus = { Pending: 0, Active: 1, Completed: 2, Cancelled: 3, Invalid: 4 } as const
const SettlementMode = { None: 0, TopWinners: 1, CreatorRefund: 2, SplitWinCompleted: 3 } as const

async function deployFixture() {
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
  await x2EarnApps.setAppExists(APP_1, true)

  const { ChallengeCoreLogic: challengeCoreLogic, ChallengeSettlementLogic: challengeSettlementLogic } =
    await challengesLibraries({ logOutput: false })

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
        maxParticipants: 100,
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

describe("B3TRChallenges - Passport gating - @shard9b", function () {
  // ──── joinChallenge: block non-persons in both private and public flows ────

  it("rejects joinChallenge from a non-person in a private (Stake) challenge", async function () {
    const { admin, alice, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    // Stake/Private/MaxActions; admin auto-joins as creator.
    await challenges.createChallenge({
      kind: ChallengeKind.Stake,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      stakeAmount: STAKE_AMOUNT,
      startRound: 2,
      endRound: 3,
      threshold: 0,
      numWinners: 0,
      appIds: [APP_1],
      invitees: [alice.address],
      title: "",
      description: "",
      imageURI: "",
      metadataURI: "",
    })

    await passport.setIsPerson(alice.address, false, "User is blacklisted")

    await expect(challenges.connect(alice).joinChallenge(1))
      .to.be.revertedWithCustomError(challenges, "NotVerifiedPerson")
      .withArgs(alice.address, "User is blacklisted")

    expect(admin.address).to.not.equal(alice.address) // sanity
  })

  it("rejects joinChallenge from a non-person in a public (Sponsored SplitWin) challenge", async function () {
    const { alice, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await challenges.createChallenge({
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      challengeType: ChallengeType.SplitWin,
      stakeAmount: ethers.parseEther("300"),
      startRound: 2,
      endRound: 3,
      threshold: 3,
      numWinners: 2,
      appIds: [],
      invitees: [],
      title: "",
      description: "",
      imageURI: "",
      metadataURI: "",
    })

    await passport.setIsPerson(alice.address, false, "User has been signaled too many times")

    await expect(challenges.connect(alice).joinChallenge(1))
      .to.be.revertedWithCustomError(challenges, "NotVerifiedPerson")
      .withArgs(alice.address, "User has been signaled too many times")
  })

  // ──── createChallenge: block non-person creators of stake challenges ────

  it("rejects createChallenge when a non-person creator would auto-join a Stake challenge", async function () {
    const { admin, alice, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)
    await passport.setIsPerson(admin.address, false, "User is blacklisted")

    await expect(
      challenges.createChallenge({
        kind: ChallengeKind.Stake,
        visibility: ChallengeVisibility.Private,
        challengeType: ChallengeType.MaxActions,
        stakeAmount: STAKE_AMOUNT,
        startRound: 2,
        endRound: 3,
        threshold: 0,
        numWinners: 0,
        appIds: [APP_1],
        invitees: [alice.address],
        title: "",
        description: "",
        imageURI: "",
        metadataURI: "",
      }),
    )
      .to.be.revertedWithCustomError(challenges, "NotVerifiedPerson")
      .withArgs(admin.address, "User is blacklisted")
  })

  it("allows createChallenge with a non-person creator for Sponsored challenges (no auto-join)", async function () {
    const { admin, alice, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)
    await passport.setIsPerson(admin.address, false, "User is blacklisted")

    // Sponsored creators do not participate, so personhood is not required to fund the prize pool.
    await challenges.createChallenge({
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      stakeAmount: STAKE_AMOUNT,
      startRound: 2,
      endRound: 3,
      threshold: 0,
      numWinners: 0,
      appIds: [APP_1],
      invitees: [alice.address],
      title: "",
      description: "",
      imageURI: "",
      metadataURI: "",
    })

    expect(await challenges.challengeCount()).to.equal(1n)
  })

  // ──── claimChallengePayout: block non-person winners; refund branch stays open ────

  it("rejects claimChallengePayout when a winner lost personhood after the challenge ended", async function () {
    const { admin, alice, bob, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await challenges.createChallenge({
      kind: ChallengeKind.Stake,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      stakeAmount: STAKE_AMOUNT,
      startRound: 2,
      endRound: 3,
      threshold: 0,
      numWinners: 0,
      appIds: [APP_1],
      invitees: [alice.address, bob.address],
      title: "",
      description: "",
      imageURI: "",
      metadataURI: "",
    })
    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)

    // alice wins outright.
    await passport.setUserRoundActionCountApp(admin.address, 2, APP_1, 1)
    await passport.setUserRoundActionCountApp(alice.address, 2, APP_1, 10)
    await passport.setUserRoundActionCountApp(bob.address, 2, APP_1, 5)

    await roundGovernor.setCurrentRoundId(4)
    await challenges.completeChallenge(1)

    const challenge = await challenges.getChallenge(1)
    expect(challenge.settlementMode).to.equal(SettlementMode.TopWinners)
    expect(challenge.bestScore).to.equal(10n)

    // After settlement alice is blacklisted: she cannot collect the reward.
    await passport.setIsPerson(alice.address, false, "User is blacklisted")
    await expect(challenges.connect(alice).claimChallengePayout(1))
      .to.be.revertedWithCustomError(challenges, "NotVerifiedPerson")
      .withArgs(alice.address, "User is blacklisted")
  })

  it("allows the creator to collect the CreatorRefund branch even if they are no longer a person", async function () {
    const { admin, alice, bob, b3tr, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    // Sponsored Private MaxActions. Alice and bob join but both are non-persons at settlement, so
    // completeChallenge skips them, bestCount stays 0, and the contract enters CreatorRefund mode.
    await challenges.createChallenge({
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      stakeAmount: STAKE_AMOUNT,
      startRound: 2,
      endRound: 3,
      threshold: 0,
      numWinners: 0,
      appIds: [APP_1],
      invitees: [alice.address, bob.address],
      title: "",
      description: "",
      imageURI: "",
      metadataURI: "",
    })
    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)

    await passport.setUserRoundActionCountApp(alice.address, 2, APP_1, 5)
    await passport.setUserRoundActionCountApp(bob.address, 2, APP_1, 7)
    await passport.setIsPerson(alice.address, false, "User is blacklisted")
    await passport.setIsPerson(bob.address, false, "User is blacklisted")

    await roundGovernor.setCurrentRoundId(4)
    await challenges.completeChallenge(1)

    const challenge = await challenges.getChallenge(1)
    expect(challenge.bestCount).to.equal(0n)
    expect(challenge.settlementMode).to.equal(SettlementMode.CreatorRefund)

    // Creator also becomes non-person; the refund branch must still pay out.
    await passport.setIsPerson(admin.address, false, "User is blacklisted")
    const balanceBefore = await b3tr.balanceOf(admin.address)
    await challenges.claimChallengePayout(1)
    expect(await b3tr.balanceOf(admin.address)).to.equal(balanceBefore + STAKE_AMOUNT)
  })

  // ──── claimSplitWinPrize: block non-persons ────

  it("rejects claimSplitWinPrize when a participant is no longer a person", async function () {
    const { alice, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await challenges.createChallenge({
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      challengeType: ChallengeType.SplitWin,
      stakeAmount: ethers.parseEther("300"),
      startRound: 2,
      endRound: 3,
      threshold: 3,
      numWinners: 2,
      appIds: [],
      invitees: [],
      title: "",
      description: "",
      imageURI: "",
      metadataURI: "",
    })
    await challenges.connect(alice).joinChallenge(1)

    await roundGovernor.setCurrentRoundId(2)
    await challenges.syncChallenge(1)

    await passport.setUserRoundActionCount(alice.address, 2, 5)
    await passport.setIsPerson(alice.address, false, "User does not meet the criteria to be considered a person")

    await expect(challenges.connect(alice).claimSplitWinPrize(1))
      .to.be.revertedWithCustomError(challenges, "NotVerifiedPerson")
      .withArgs(alice.address, "User does not meet the criteria to be considered a person")
  })

  // ──── completeChallenge: skip non-persons from bestScore selection ────

  it("completeChallenge skips non-persons so the prize goes to the top verified participant", async function () {
    const { admin, alice, bob, b3tr, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await challenges.createChallenge({
      kind: ChallengeKind.Stake,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      stakeAmount: STAKE_AMOUNT,
      startRound: 2,
      endRound: 3,
      threshold: 0,
      numWinners: 0,
      appIds: [APP_1],
      invitees: [alice.address, bob.address],
      title: "",
      description: "",
      imageURI: "",
      metadataURI: "",
    })
    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)

    // alice has the highest score, but she is non-person at settlement.
    // bob is verified with the runner-up score, and should become the sole top-winner.
    await passport.setUserRoundActionCountApp(admin.address, 2, APP_1, 1)
    await passport.setUserRoundActionCountApp(alice.address, 2, APP_1, 100)
    await passport.setUserRoundActionCountApp(bob.address, 2, APP_1, 7)
    await passport.setIsPerson(alice.address, false, "User is blacklisted")

    await roundGovernor.setCurrentRoundId(4)
    await challenges.completeChallenge(1)

    const challenge = await challenges.getChallenge(1)
    expect(challenge.bestScore).to.equal(7n)
    expect(challenge.bestCount).to.equal(1n)
    expect(challenge.settlementMode).to.equal(SettlementMode.TopWinners)

    // alice cannot claim (both NotEligible — score < bestScore — and would also fail personhood).
    await expect(challenges.connect(alice).claimChallengePayout(1)).to.be.revertedWithCustomError(
      challenges,
      "NothingToClaim",
    )

    // bob collects the full pot (3 stakes = 300).
    const bobBalanceBefore = await b3tr.balanceOf(bob.address)
    await challenges.connect(bob).claimChallengePayout(1)
    expect(await b3tr.balanceOf(bob.address)).to.equal(bobBalanceBefore + ethers.parseEther("300"))
  })

  // ──── Refund paths stay open for non-persons ────

  it("claimChallengeRefund still succeeds for a non-person participant on a cancelled stake challenge", async function () {
    const { alice, b3tr, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    await challenges.createChallenge({
      kind: ChallengeKind.Stake,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      stakeAmount: STAKE_AMOUNT,
      startRound: 2,
      endRound: 3,
      threshold: 0,
      numWinners: 0,
      appIds: [APP_1],
      invitees: [alice.address],
      title: "",
      description: "",
      imageURI: "",
      metadataURI: "",
    })
    await challenges.connect(alice).joinChallenge(1)

    await challenges.cancelChallenge(1)
    expect(await challenges.getChallengeStatus(1)).to.equal(ChallengeStatus.Cancelled)

    // alice becomes non-person AFTER joining — she should still get her stake back.
    await passport.setIsPerson(alice.address, false, "User is blacklisted")

    const balanceBefore = await b3tr.balanceOf(alice.address)
    await challenges.connect(alice).claimChallengeRefund(1)
    expect(await b3tr.balanceOf(alice.address)).to.equal(balanceBefore + STAKE_AMOUNT)
  })

  it("claimCreatorSplitWinRefund still succeeds for a non-person creator after end round", async function () {
    const { admin, alice, b3tr, roundGovernor, passport, challenges } = await deployFixture()
    await roundGovernor.setCurrentRoundId(1)

    const sponsorAmount = ethers.parseEther("300")
    await challenges.createChallenge({
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      challengeType: ChallengeType.SplitWin,
      stakeAmount: sponsorAmount,
      startRound: 2,
      endRound: 3,
      threshold: 3,
      numWinners: 2,
      appIds: [],
      invitees: [],
      title: "",
      description: "",
      imageURI: "",
      metadataURI: "",
    })

    // alice joins so the challenge becomes Active rather than Invalid — but does not claim a slot.
    await challenges.connect(alice).joinChallenge(1)
    await roundGovernor.setCurrentRoundId(2)
    await challenges.syncChallenge(1)
    expect(await challenges.getChallengeStatus(1)).to.equal(ChallengeStatus.Active)

    // After endRound, no winners; creator reclaims the whole pool via the refund path even when non-person.
    await roundGovernor.setCurrentRoundId(4)
    await passport.setIsPerson(admin.address, false, "User is blacklisted")

    const balanceBefore = await b3tr.balanceOf(admin.address)
    await challenges.claimCreatorSplitWinRefund(1)
    expect(await b3tr.balanceOf(admin.address)).to.equal(balanceBefore + sponsorAmount)
  })
})
