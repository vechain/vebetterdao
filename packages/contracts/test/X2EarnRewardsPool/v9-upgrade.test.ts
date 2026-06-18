import { ethers } from "hardhat"
import { expect } from "chai"
import { describe, it, beforeEach } from "mocha"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { filterEventsByName, getOrDeployContractInstances } from "../helpers"
import { endorseApp } from "../helpers/xnodes"
import { B3TR, VeBetterPassport, X2EarnApps, X2EarnRewardsPool } from "../../typechain-types"

// Categories mirror the contract enum order (see IX2EarnRewardsPool.NonProofRewardCategory)
const Category = {
  Endorser: 0,
  Leaderboard: 1,
  Streak: 2,
  Cashback: 3,
  Referral: 4,
  Other: 5,
} as const

describe("X2EarnRewardsPool - V9 - @shard12b", function () {
  let x2EarnRewardsPool: X2EarnRewardsPool
  let x2EarnApps: X2EarnApps
  let b3tr: B3TR
  let veBetterPassport: VeBetterPassport
  let owner: HardhatEthersSigner
  let minterAccount: HardhatEthersSigner
  let user: HardhatEthersSigner
  let teamWallet: HardhatEthersSigner
  let appId: string
  const FUND_AMOUNT = ethers.parseEther("100")

  beforeEach(async function () {
    const ctx = await getOrDeployContractInstances({
      forceDeploy: true,
      bootstrapAndStartEmissions: true,
    })
    x2EarnRewardsPool = ctx.x2EarnRewardsPool
    x2EarnApps = ctx.x2EarnApps
    b3tr = ctx.b3tr
    veBetterPassport = ctx.veBetterPassport
    owner = ctx.owner
    minterAccount = ctx.minterAccount
    teamWallet = ctx.otherAccounts[10]
    user = ctx.otherAccounts[11]

    await x2EarnApps.submitApp(teamWallet.address, owner.address, "V9 app", "uri")
    appId = await x2EarnApps.hashAppName("V9 app")
    await endorseApp(appId, owner)

    // Use the treasury (availableFunds) path so we can assert balance changes simply
    await x2EarnRewardsPool.connect(owner).toggleRewardsPoolBalance(appId, false)

    await x2EarnApps.connect(owner).addRewardDistributor(appId, owner.address)

    await b3tr.connect(minterAccount).mint(owner.address, FUND_AMOUNT)
    await b3tr.connect(owner).approve(await x2EarnRewardsPool.getAddress(), FUND_AMOUNT)
    await x2EarnRewardsPool.connect(owner).deposit(FUND_AMOUNT, appId)
  })

  describe("Version & state preservation", function () {
    it("reports version 9", async function () {
      expect(await x2EarnRewardsPool.version()).to.equal("9")
    })

    it("preserves V8 state (impact keys, available funds) after upgrade chain", async function () {
      expect(await x2EarnRewardsPool.availableFunds(appId)).to.equal(FUND_AMOUNT)
      const keys = await x2EarnRewardsPool.getAllowedImpactKeys()
      expect(keys.length).to.be.greaterThan(0)
    })
  })

  describe("distributeNonProofReward", function () {
    it("transfers B3TR and emits NonProofRewardDistributed with the typed category", async function () {
      const amount = ethers.parseEther("1")

      const tx = await x2EarnRewardsPool
        .connect(owner)
        .distributeNonProofReward(appId, amount, user.address, Category.Leaderboard, "Week 12 leaderboard - 3rd place")
      const receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      expect(await b3tr.balanceOf(user.address)).to.equal(amount)
      expect(await x2EarnRewardsPool.availableFunds(appId)).to.equal(FUND_AMOUNT - amount)

      const events = filterEventsByName(receipt.logs, "NonProofRewardDistributed")
      expect(events).to.have.length(1)
      expect(events[0].args[0]).to.equal(amount)
      expect(events[0].args[1]).to.equal(appId)
      expect(events[0].args[2]).to.equal(user.address)
      expect(events[0].args[3]).to.equal(Category.Leaderboard)
      expect(events[0].args[4]).to.equal("Week 12 leaderboard - 3rd place")
      expect(events[0].args[5]).to.equal(owner.address)
    })

    it("does NOT emit RewardDistributed (passport-action signal)", async function () {
      const tx = await x2EarnRewardsPool
        .connect(owner)
        .distributeNonProofReward(appId, ethers.parseEther("1"), user.address, Category.Endorser, "")
      const receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      const rewardEvents = filterEventsByName(receipt.logs, "RewardDistributed")
      expect(rewardEvents).to.eql([])
    })

    it("does NOT register a passport action for the receiver", async function () {
      // currentRoundId is the round any registerAction call would land in
      const { xAllocationVoting } = await getOrDeployContractInstances({ forceDeploy: false })
      const roundBefore = await xAllocationVoting.currentRoundId()

      await x2EarnRewardsPool
        .connect(owner)
        .distributeNonProofReward(appId, ethers.parseEther("1"), user.address, Category.Streak, "")

      // userRoundAppCount tracks distinct apps the user got passport credit for in the round.
      // A non-proof reward MUST leave that counter at 0.
      expect(await veBetterPassport.userRoundAppCount(user.address, roundBefore)).to.equal(0)
    })

    it("reverts when caller is not a reward distributor", async function () {
      const ctx = await getOrDeployContractInstances({ forceDeploy: false })
      const stranger = ctx.otherAccounts[15]
      await expect(
        x2EarnRewardsPool
          .connect(stranger)
          .distributeNonProofReward(appId, ethers.parseEther("1"), user.address, Category.Other, ""),
      ).to.be.revertedWith("X2EarnRewardsPool: not a reward distributor")
    })

    it("reverts when distribution is paused", async function () {
      await x2EarnRewardsPool.connect(owner).pauseDistribution(appId)
      await expect(
        x2EarnRewardsPool
          .connect(owner)
          .distributeNonProofReward(appId, ethers.parseEther("1"), user.address, Category.Cashback, ""),
      ).to.be.revertedWith("X2EarnRewardsPool: distribution is paused")
    })

    it("reverts when the app has insufficient available funds", async function () {
      // Over-fund the contract so the contract-balance check passes; appId's availableFunds is the binding limit
      await b3tr.connect(minterAccount).mint(await x2EarnRewardsPool.getAddress(), FUND_AMOUNT)
      await expect(
        x2EarnRewardsPool
          .connect(owner)
          .distributeNonProofReward(appId, FUND_AMOUNT + 1n, user.address, Category.Other, ""),
      ).to.be.revertedWith("X2EarnRewardsPool: app has insufficient available funds")
    })
  })

  describe("Mandatory proof on *WithProof* variants", function () {
    const noProof: [string[], string[]] = [[], []]
    const validProof: [string[], string[]] = [["image"], ["https://example.com/p.png"]]

    it("distributeRewardWithProof reverts with empty proof arrays", async function () {
      await expect(
        x2EarnRewardsPool
          .connect(owner)
          .distributeRewardWithProof(appId, ethers.parseEther("1"), user.address, noProof[0], noProof[1], [], [], ""),
      ).to.be.revertedWith("X2EarnRewardsPool: proof is mandatory")
    })

    it("distributeRewardWithProofAndMetadata reverts with empty proof arrays", async function () {
      await expect(
        x2EarnRewardsPool
          .connect(owner)
          .distributeRewardWithProofAndMetadata(
            appId,
            ethers.parseEther("1"),
            user.address,
            noProof[0],
            noProof[1],
            [],
            [],
            "",
            "",
          ),
      ).to.be.revertedWith("X2EarnRewardsPool: proof is mandatory")
    })

    it("distributeRewardWithProof succeeds when proof arrays are non-empty", async function () {
      await expect(
        x2EarnRewardsPool
          .connect(owner)
          .distributeRewardWithProof(
            appId,
            ethers.parseEther("1"),
            user.address,
            validProof[0],
            validProof[1],
            [],
            [],
            "",
          ),
      ).to.not.be.reverted
    })
  })

  describe("Mandatory proof on *WithProof*ForRound variants", function () {
    let actionRound: bigint

    beforeEach(async function () {
      const { xAllocationVoting } = await getOrDeployContractInstances({ forceDeploy: false })
      actionRound = await xAllocationVoting.currentRoundId()
    })

    it("distributeRewardWithProofForRound reverts with empty proof arrays", async function () {
      await expect(
        x2EarnRewardsPool
          .connect(owner)
          .distributeRewardWithProofForRound(
            appId,
            ethers.parseEther("1"),
            user.address,
            [],
            [],
            [],
            [],
            "",
            actionRound,
          ),
      ).to.be.revertedWith("X2EarnRewardsPool: proof is mandatory")
    })

    it("distributeRewardWithProofAndMetadataForRound reverts with empty proof arrays", async function () {
      await expect(
        x2EarnRewardsPool
          .connect(owner)
          .distributeRewardWithProofAndMetadataForRound(
            appId,
            ethers.parseEther("1"),
            user.address,
            [],
            [],
            [],
            [],
            "",
            "",
            actionRound,
          ),
      ).to.be.revertedWith("X2EarnRewardsPool: proof is mandatory")
    })
  })

  describe("distributeRewardDeprecatedForRound", function () {
    it("transfers B3TR, emits the provided JSON proof and registers action in the given round", async function () {
      const { xAllocationVoting } = await getOrDeployContractInstances({ forceDeploy: false })
      const actionRound = await xAllocationVoting.currentRoundId()
      const amount = ethers.parseEther("1")
      const proofJson = '{"version":2,"proof":{"image":"https://x.png"}}'

      const tx = await x2EarnRewardsPool
        .connect(owner)
        .distributeRewardDeprecatedForRound(appId, amount, user.address, proofJson, actionRound)
      const receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      expect(await b3tr.balanceOf(user.address)).to.equal(amount)
      expect(await x2EarnRewardsPool.availableFunds(appId)).to.equal(FUND_AMOUNT - amount)

      const events = filterEventsByName(receipt.logs, "RewardDistributed")
      expect(events).to.have.length(1)
      expect(events[0].args[3]).to.equal(proofJson)

      // A passport action should have been registered against actionRound
      expect(await veBetterPassport.userRoundAppCount(user.address, actionRound)).to.equal(1)
    })

    it("reverts when the actionRound exceeds the current round", async function () {
      const { xAllocationVoting } = await getOrDeployContractInstances({ forceDeploy: false })
      const tooFar = (await xAllocationVoting.currentRoundId()) + 1n
      await expect(
        x2EarnRewardsPool
          .connect(owner)
          .distributeRewardDeprecatedForRound(appId, ethers.parseEther("1"), user.address, "", tooFar),
      ).to.be.revertedWith("X2EarnRewardsPool: actionRound exceeds current round")
    })

    it("reverts when actionRound is zero", async function () {
      await expect(
        x2EarnRewardsPool
          .connect(owner)
          .distributeRewardDeprecatedForRound(appId, ethers.parseEther("1"), user.address, "", 0),
      ).to.be.revertedWith("X2EarnRewardsPool: actionRound is zero")
    })
  })

  describe("distributeReward backward compatibility", function () {
    it("still transfers B3TR and registers a passport action (deprecated but functional)", async function () {
      const { xAllocationVoting } = await getOrDeployContractInstances({ forceDeploy: false })
      const round = await xAllocationVoting.currentRoundId()
      const amount = ethers.parseEther("1")

      const tx = await x2EarnRewardsPool.connect(owner).distributeReward(appId, amount, user.address, "")
      const receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      expect(await b3tr.balanceOf(user.address)).to.equal(amount)
      expect(await x2EarnRewardsPool.availableFunds(appId)).to.equal(FUND_AMOUNT - amount)
      expect(await veBetterPassport.userRoundAppCount(user.address, round)).to.equal(1)

      const events = filterEventsByName(receipt.logs, "RewardDistributed")
      expect(events).to.have.length(1)
      expect(events[0].args[3]).to.equal("")
    })
  })
})
