import { expect } from "chai"
import { ethers } from "hardhat"
import { deployProxy, upgradeProxy } from "../../scripts/helpers"
import { challengesLibraries } from "../../scripts/libraries"
import {
  B3TR,
  B3TRChallenges,
  B3TRChallengesV1,
  MockPassportActions,
  MockRoundGovernor,
  MockX2EarnApps,
} from "../../typechain-types"

const STAKE_AMOUNT = ethers.parseEther("100")
const MIN_BET_AMOUNT = ethers.parseEther("100")
const INITIAL_BALANCE = ethers.parseEther("1000")
const APP_1 = ethers.keccak256(ethers.toUtf8Bytes("app-1"))

const ChallengeKind = { Stake: 0, Sponsored: 1 } as const
const ChallengeVisibility = { Public: 0, Private: 1 } as const
const ChallengeType = { MaxActions: 0, SplitWin: 1 } as const
const ParticipantStatus = { None: 0, Invited: 1, Declined: 2, Joined: 3 } as const

async function deployV1Fixture() {
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

  // V1 libraries — deployed against the snapshot in deprecated/V1/.
  const ChallengeCoreLogicV1Factory = await ethers.getContractFactory("ChallengeCoreLogicV1")
  const challengeCoreLogicV1 = await ChallengeCoreLogicV1Factory.deploy()
  await challengeCoreLogicV1.waitForDeployment()
  const ChallengeSettlementLogicV1Factory = await ethers.getContractFactory("ChallengeSettlementLogicV1", {
    libraries: { ChallengeCoreLogicV1: await challengeCoreLogicV1.getAddress() },
  })
  const challengeSettlementLogicV1 = await ChallengeSettlementLogicV1Factory.deploy()
  await challengeSettlementLogicV1.waitForDeployment()

  const challengesV1 = (await deployProxy(
    "B3TRChallengesV1",
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
      ChallengeCoreLogicV1: await challengeCoreLogicV1.getAddress(),
      ChallengeSettlementLogicV1: await challengeSettlementLogicV1.getAddress(),
    },
  )) as B3TRChallengesV1

  for (const signer of [admin, alice, bob, carol]) {
    await b3tr.mint(signer.address, INITIAL_BALANCE)
    await b3tr.connect(signer).approve(await challengesV1.getAddress(), INITIAL_BALANCE)
  }

  return { admin, alice, bob, carol, b3tr, roundGovernor, passport, x2EarnApps, challengesV1 }
}

describe("B3TRChallenges - V2 Upgrade - @shard9c", function () {
  it("deploys at V1, seeds state, upgrades to V2, and preserves storage layout", async function () {
    const { admin, alice, bob, carol, roundGovernor, passport, challengesV1 } = await deployV1Fixture()
    await roundGovernor.setCurrentRoundId(1)

    // Seed: create a stake challenge, have alice + bob join, leave carol invited-but-not-joined.
    await challengesV1.createChallenge({
      kind: ChallengeKind.Stake,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      stakeAmount: STAKE_AMOUNT,
      startRound: 2,
      endRound: 3,
      threshold: 0,
      numWinners: 0,
      appIds: [APP_1],
      invitees: [alice.address, bob.address, carol.address],
      title: "v1-state",
      description: "v1-state-description",
      imageURI: "v1-image",
      metadataURI: "v1-metadata",
    })
    await challengesV1.connect(alice).joinChallenge(1)
    await challengesV1.connect(bob).joinChallenge(1)
    // carol stays invited

    expect(await challengesV1.version()).to.equal("1")
    const challengeBeforeUpgrade = await challengesV1.getChallenge(1)
    const participantsBefore = await challengesV1.getChallengeParticipants(1)
    const invitedBefore = await challengesV1.getChallengeInvited(1)
    const challengeCountBefore = await challengesV1.challengeCount()

    // Deploy fresh V2 libraries and upgrade in place.
    const { ChallengeCoreLogic, ChallengeSettlementLogic } = await challengesLibraries({ logOutput: false })

    const challengesV2 = (await upgradeProxy(
      "B3TRChallengesV1",
      "B3TRChallenges",
      await challengesV1.getAddress(),
      [],
      {
        version: 2,
        libraries: {
          ChallengeCoreLogic: await ChallengeCoreLogic.getAddress(),
          ChallengeSettlementLogic: await ChallengeSettlementLogic.getAddress(),
        },
      },
    )) as B3TRChallenges

    expect(await challengesV2.version()).to.equal("2")
    expect(await challengesV2.challengeCount()).to.equal(challengeCountBefore)

    const challengeAfterUpgrade = await challengesV2.getChallenge(1)
    expect(challengeAfterUpgrade.creator).to.equal(challengeBeforeUpgrade.creator)
    expect(challengeAfterUpgrade.stakeAmount).to.equal(challengeBeforeUpgrade.stakeAmount)
    expect(challengeAfterUpgrade.totalPrize).to.equal(challengeBeforeUpgrade.totalPrize)
    expect(challengeAfterUpgrade.startRound).to.equal(challengeBeforeUpgrade.startRound)
    expect(challengeAfterUpgrade.endRound).to.equal(challengeBeforeUpgrade.endRound)
    expect(challengeAfterUpgrade.participantCount).to.equal(challengeBeforeUpgrade.participantCount)
    expect(challengeAfterUpgrade.invitedCount).to.equal(challengeBeforeUpgrade.invitedCount)
    expect(challengeAfterUpgrade.title).to.equal(challengeBeforeUpgrade.title)
    expect(challengeAfterUpgrade.description).to.equal(challengeBeforeUpgrade.description)
    expect(challengeAfterUpgrade.imageURI).to.equal(challengeBeforeUpgrade.imageURI)
    expect(challengeAfterUpgrade.metadataURI).to.equal(challengeBeforeUpgrade.metadataURI)

    expect(await challengesV2.getChallengeParticipants(1)).to.deep.equal(participantsBefore)
    expect(await challengesV2.getChallengeInvited(1)).to.deep.equal(invitedBefore)

    expect(await challengesV2.getParticipantStatus(1, admin.address)).to.equal(ParticipantStatus.Joined)
    expect(await challengesV2.getParticipantStatus(1, alice.address)).to.equal(ParticipantStatus.Joined)
    expect(await challengesV2.getParticipantStatus(1, bob.address)).to.equal(ParticipantStatus.Joined)
    expect(await challengesV2.getParticipantStatus(1, carol.address)).to.equal(ParticipantStatus.Invited)

    // V2 passport gate is active for new joins. Carol still invited but non-person → cannot join post-upgrade.
    await passport.setIsBlacklisted(carol.address, true)
    await expect(challengesV2.connect(carol).joinChallenge(1))
      .to.be.revertedWithCustomError(challengesV2, "NotVerifiedPerson")
      .withArgs(carol.address, "User is blacklisted")
  })
})
