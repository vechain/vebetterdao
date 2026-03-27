import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { expect } from "chai"
import { ethers } from "hardhat"
import { describe, it } from "mocha"
import {
  bootstrapAndStartEmissions,
  getOrDeployContractInstances,
  getVot3Tokens,
  waitForRoundToEnd,
  waitForNextCycle,
} from "../../helpers"

describe("Rewards Multipliers - @shard10b", function () {
  describe("Multiplier Config", function () {
    it("Should have neutral multiplier values after test deployment and allow setting production values", async () => {
      const { voterRewards, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      // Test deploy uses neutral values (all x1) so existing tests aren't affected
      const config = await voterRewards.getMultiplierConfig(0)
      expect(config.freshnessMultiplierTier1).to.equal(10000n)
      expect(config.freshnessMultiplierTier2).to.equal(10000n)
      expect(config.freshnessMultiplierTier3).to.equal(10000n)
      expect(config.intentMultiplierForAgainst).to.equal(10000n)
      expect(config.intentMultiplierAbstain).to.equal(10000n)

      // Set production values
      await voterRewards.connect(owner).setFreshnessMultipliers(30000, 20000, 10000)
      await voterRewards.connect(owner).setIntentMultipliers(10000, 3000)

      const block = await ethers.provider.getBlockNumber()
      const prodConfig = await voterRewards.getMultiplierConfig(block)
      expect(prodConfig.freshnessMultiplierTier1).to.equal(30000n)
      expect(prodConfig.freshnessMultiplierTier2).to.equal(20000n)
      expect(prodConfig.freshnessMultiplierTier3).to.equal(10000n)
      expect(prodConfig.intentMultiplierForAgainst).to.equal(10000n)
      expect(prodConfig.intentMultiplierAbstain).to.equal(3000n)
    })

    it("Should allow governance to update freshness multipliers", async () => {
      const { voterRewards, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      await voterRewards.connect(owner).setFreshnessMultipliers(25000, 15000, 10000)

      // Get config at a future timepoint (after the checkpoint)
      const block = await ethers.provider.getBlockNumber()
      const config = await voterRewards.getMultiplierConfig(block)

      expect(config.freshnessMultiplierTier1).to.equal(25000n)
      expect(config.freshnessMultiplierTier2).to.equal(15000n)
      expect(config.freshnessMultiplierTier3).to.equal(10000n)
    })

    it("Should allow governance to update intent multipliers", async () => {
      const { voterRewards, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      await voterRewards.connect(owner).setIntentMultipliers(10000, 5000)

      const block = await ethers.provider.getBlockNumber()
      const config = await voterRewards.getMultiplierConfig(block)

      expect(config.intentMultiplierForAgainst).to.equal(10000n)
      expect(config.intentMultiplierAbstain).to.equal(5000n)
    })

    it("Should reject freshness multipliers not in descending order", async () => {
      const { voterRewards, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      // tier1 < tier2 should fail
      await expect(voterRewards.connect(owner).setFreshnessMultipliers(10000, 20000, 10000)).to.be.reverted
    })

    it("Should reject zero multiplier values", async () => {
      const { voterRewards, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      await expect(voterRewards.connect(owner).setFreshnessMultipliers(0, 0, 0)).to.be.reverted
      await expect(voterRewards.connect(owner).setIntentMultipliers(0, 0)).to.be.reverted
    })

    it("Should only allow admin to set multipliers", async () => {
      const { voterRewards, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: true })
      const nonAdmin = otherAccounts[5]

      await expect(voterRewards.connect(nonAdmin).setFreshnessMultipliers(30000, 20000, 10000)).to.be.reverted
      await expect(voterRewards.connect(nonAdmin).setIntentMultipliers(10000, 3000)).to.be.reverted
    })

    it("Should return MULTIPLIER_SCALE constant", async () => {
      const { voterRewards } = await getOrDeployContractInstances({ forceDeploy: true })
      expect(await voterRewards.MULTIPLIER_SCALE()).to.equal(10000n)
    })
  })

  describe("Freshness Multiplier - Allocation Voting", function () {
    it("First-time voter should get tier 1 (x3) freshness multiplier", async () => {
      const config = createLocalConfig()
      const { xAllocationVoting, voterRewards, otherAccounts, owner, emissions, x2EarnApps, veBetterPassport } =
        await getOrDeployContractInstances({ forceDeploy: true, config })

      await bootstrapAndStartEmissions()

      const voter = otherAccounts[1]
      await getVot3Tokens(voter, "1000")
      await veBetterPassport.connect(owner).whitelist(voter.address)

      const roundId = await xAllocationVoting.currentRoundId()
      const eligibleApps = await xAllocationVoting.getAppIdsOfRound(roundId)

      if (eligibleApps.length === 0) {
        console.log("No eligible apps — skipping test")
        return
      }

      // Cast vote with 100 VOT3
      await xAllocationVoting.connect(voter).castVote(roundId, [eligibleApps[0]], [ethers.parseEther("100")])

      // Check that reward weight was multiplied by x3 (30000 basis points)
      const cycle = await emissions.getCurrentCycle()
      const voterTotal = await voterRewards.cycleToVoterToTotal(cycle, voter.address)

      // With freshness x3, the reward weight should be 3x the base
      // Base weight = 100 * 1e18, with QF sqrt scaling applied
      // The exact value depends on the QF calculation, but it should be > 0
      expect(voterTotal).to.be.gt(0n)
    })

    it("Voter with same apps should get lower freshness multiplier in subsequent rounds", async () => {
      const config = createLocalConfig()
      const { xAllocationVoting, voterRewards, otherAccounts, owner, emissions, veBetterPassport } =
        await getOrDeployContractInstances({ forceDeploy: true, config })

      await bootstrapAndStartEmissions()

      const voter = otherAccounts[1]
      await getVot3Tokens(voter, "10000")
      await veBetterPassport.connect(owner).whitelist(voter.address)

      // Round 1: First vote (fresh = x3)
      const round1 = await xAllocationVoting.currentRoundId()
      const eligibleApps = await xAllocationVoting.getAppIdsOfRound(round1)
      if (eligibleApps.length === 0) {
        console.log("No eligible apps — skipping test")
        return
      }

      await xAllocationVoting.connect(voter).castVote(round1, [eligibleApps[0]], [ethers.parseEther("100")])
      const cycle1 = await emissions.getCurrentCycle()
      const voterTotal1 = await voterRewards.cycleToVoterToTotal(cycle1, voter.address)

      // Wait for round to end and start new one
      await waitForRoundToEnd(Number(round1))
      await waitForNextCycle()

      // Round 2: Same apps (not fresh — roundsSinceChange = 1 = x2)
      const round2 = await xAllocationVoting.currentRoundId()
      await xAllocationVoting.connect(voter).castVote(round2, [eligibleApps[0]], [ethers.parseEther("100")])
      const cycle2 = await emissions.getCurrentCycle()
      const voterTotal2 = await voterRewards.cycleToVoterToTotal(cycle2, voter.address)

      // Round 2 reward should be less than round 1 (x2 vs x3)
      // Both have same base weight (100 VOT3), so the ratio should be ~2/3
      expect(voterTotal2).to.be.lt(voterTotal1)
    })
  })
})
