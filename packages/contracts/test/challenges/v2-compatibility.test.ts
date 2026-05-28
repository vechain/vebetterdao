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

async function deployV1ThenUpgrade() {
  const [admin, alice, bob] = await ethers.getSigners()

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

  for (const signer of [admin, alice, bob]) {
    await b3tr.mint(signer.address, INITIAL_BALANCE)
    await b3tr.connect(signer).approve(await challengesV1.getAddress(), INITIAL_BALANCE)
  }

  // Upgrade to V2 with the production libraries.
  const { ChallengeCoreLogic, ChallengeSettlementLogic } = await challengesLibraries({ logOutput: false })
  const challenges = (await upgradeProxy("B3TRChallengesV1", "B3TRChallenges", await challengesV1.getAddress(), [], {
    version: 2,
    libraries: {
      ChallengeCoreLogic: await ChallengeCoreLogic.getAddress(),
      ChallengeSettlementLogic: await ChallengeSettlementLogic.getAddress(),
    },
  })) as B3TRChallenges

  return { admin, alice, bob, b3tr, roundGovernor, passport, challenges }
}

describe("B3TRChallenges - V2 Compatibility - @shard9d", function () {
  it("V1-era happy path (verified persons) still works end-to-end on V2", async function () {
    const { admin, alice, bob, b3tr, roundGovernor, passport, challenges } = await deployV1ThenUpgrade()
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
      title: "compat",
      description: "",
      imageURI: "",
      metadataURI: "",
    })
    await challenges.connect(alice).joinChallenge(1)
    await challenges.connect(bob).joinChallenge(1)

    await passport.setUserRoundActionCountApp(admin.address, 2, APP_1, 1)
    await passport.setUserRoundActionCountApp(alice.address, 2, APP_1, 10)
    await passport.setUserRoundActionCountApp(bob.address, 2, APP_1, 7)

    await roundGovernor.setCurrentRoundId(4)
    await challenges.completeChallenge(1)

    const challenge = await challenges.getChallenge(1)
    expect(challenge.bestScore).to.equal(10n)
    expect(challenge.bestCount).to.equal(1n)

    const aliceBalanceBefore = await b3tr.balanceOf(alice.address)
    await challenges.connect(alice).claimChallengePayout(1)
    expect(await b3tr.balanceOf(alice.address)).to.equal(aliceBalanceBefore + ethers.parseEther("300"))
  })
})
