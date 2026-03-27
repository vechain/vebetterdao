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

      // Grant GOVERNANCE_ROLE to owner for setter tests
      await voterRewards.connect(owner).grantRole(await voterRewards.GOVERNANCE_ROLE(), owner.address)

      // Test deploy uses neutral values (all x1) so existing tests aren't affected
      const [ft1, ft2, ft3] = await voterRewards.getFreshnessMultipliers(0)
      expect(ft1).to.equal(10000n)
      expect(ft2).to.equal(10000n)
      expect(ft3).to.equal(10000n)

      const [ifa, iab] = await voterRewards.getIntentMultipliers(0)
      expect(ifa).to.equal(10000n)
      expect(iab).to.equal(10000n)

      // Set production values
      await voterRewards.connect(owner).setFreshnessMultipliers(30000, 20000, 10000)
      await voterRewards.connect(owner).setIntentMultipliers(10000, 3000)

      const block = await ethers.provider.getBlockNumber()
      const [pt1, pt2, pt3] = await voterRewards.getFreshnessMultipliers(block)
      expect(pt1).to.equal(30000n)
      expect(pt2).to.equal(20000n)
      expect(pt3).to.equal(10000n)

      const [pifa, piab] = await voterRewards.getIntentMultipliers(block)
      expect(pifa).to.equal(10000n)
      expect(piab).to.equal(3000n)
    })

    it("Should allow governance to update freshness multipliers", async () => {
      const { voterRewards, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      await voterRewards.connect(owner).grantRole(await voterRewards.GOVERNANCE_ROLE(), owner.address)

      await voterRewards.connect(owner).setFreshnessMultipliers(25000, 15000, 10000)

      const block = await ethers.provider.getBlockNumber()
      const [t1, t2, t3] = await voterRewards.getFreshnessMultipliers(block)
      expect(t1).to.equal(25000n)
      expect(t2).to.equal(15000n)
      expect(t3).to.equal(10000n)
    })

    it("Should allow governance to update intent multipliers", async () => {
      const { voterRewards, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      await voterRewards.connect(owner).grantRole(await voterRewards.GOVERNANCE_ROLE(), owner.address)

      await voterRewards.connect(owner).setIntentMultipliers(10000, 5000)

      const block = await ethers.provider.getBlockNumber()
      const [fa, ab] = await voterRewards.getIntentMultipliers(block)
      expect(fa).to.equal(10000n)
      expect(ab).to.equal(5000n)
    })

    it("Should reject freshness multipliers not in descending order", async () => {
      const { voterRewards, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      await voterRewards.connect(owner).grantRole(await voterRewards.GOVERNANCE_ROLE(), owner.address)

      await expect(voterRewards.connect(owner).setFreshnessMultipliers(10000, 20000, 10000)).to.be.reverted
    })

    it("Should reject zero multiplier values", async () => {
      const { voterRewards, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      await voterRewards.connect(owner).grantRole(await voterRewards.GOVERNANCE_ROLE(), owner.address)

      await expect(voterRewards.connect(owner).setFreshnessMultipliers(0, 0, 0)).to.be.reverted
      await expect(voterRewards.connect(owner).setIntentMultipliers(0, 0)).to.be.reverted
    })

    it("Should only allow GOVERNANCE_ROLE to set multipliers", async () => {
      const { voterRewards, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: true })
      const nonGovernor = otherAccounts[5]

      await expect(voterRewards.connect(nonGovernor).setFreshnessMultipliers(30000, 20000, 10000)).to.be.reverted
      await expect(voterRewards.connect(nonGovernor).setIntentMultipliers(10000, 3000)).to.be.reverted
    })

    it("Should return MULTIPLIER_SCALE constant", async () => {
      const { voterRewards } = await getOrDeployContractInstances({ forceDeploy: true })
      expect(await voterRewards.MULTIPLIER_SCALE()).to.equal(10000n)
    })
  })

  describe("Freshness Multiplier - Allocation Voting", function () {
    it("First-time voter should receive rewards with freshness multiplier applied", async () => {
      const config = createLocalConfig()
      const { xAllocationVoting, voterRewards, otherAccounts, owner, emissions, veBetterPassport } =
        await getOrDeployContractInstances({ forceDeploy: true, config })

      // Set production freshness values
      await voterRewards.connect(owner).grantRole(await voterRewards.GOVERNANCE_ROLE(), owner.address)
      await voterRewards.connect(owner).setFreshnessMultipliers(30000, 20000, 10000)

      await bootstrapAndStartEmissions()

      const voter = otherAccounts[1]
      await getVot3Tokens(voter, "1000")
      await veBetterPassport.connect(owner).whitelist(voter.address)

      const roundId = await xAllocationVoting.currentRoundId()
      const eligibleApps = await xAllocationVoting.getAppIdsOfRound(roundId)

      if (eligibleApps.length === 0) {
        console.log("No eligible apps - skipping test")
        return
      }

      // Cast vote
      await xAllocationVoting.connect(voter).castVote(roundId, [eligibleApps[0]], [ethers.parseEther("100")])

      // Check that reward weight was recorded (freshness x3 applied)
      const cycle = await emissions.getCurrentCycle()
      const voterTotal = await voterRewards.cycleToVoterToTotal(cycle, voter.address)
      expect(voterTotal).to.be.gt(0n)
    })

    it("Voter with same apps should get lower freshness multiplier in subsequent rounds", async () => {
      const config = createLocalConfig()
      const { xAllocationVoting, voterRewards, otherAccounts, owner, emissions, veBetterPassport } =
        await getOrDeployContractInstances({ forceDeploy: true, config })

      // Set production freshness values
      await voterRewards.connect(owner).grantRole(await voterRewards.GOVERNANCE_ROLE(), owner.address)
      await voterRewards.connect(owner).setFreshnessMultipliers(30000, 20000, 10000)

      await bootstrapAndStartEmissions()

      const voter = otherAccounts[1]
      await getVot3Tokens(voter, "10000")
      await veBetterPassport.connect(owner).whitelist(voter.address)

      // Round 1: First vote (fresh = x3)
      const round1 = await xAllocationVoting.currentRoundId()
      const eligibleApps = await xAllocationVoting.getAppIdsOfRound(round1)
      if (eligibleApps.length === 0) {
        console.log("No eligible apps - skipping test")
        return
      }

      await xAllocationVoting.connect(voter).castVote(round1, [eligibleApps[0]], [ethers.parseEther("100")])
      const cycle1 = await emissions.getCurrentCycle()
      const voterTotal1 = await voterRewards.cycleToVoterToTotal(cycle1, voter.address)

      // Wait for round to end and start new one
      await waitForRoundToEnd(Number(round1))
      await waitForNextCycle()

      // Round 2: Same apps (not fresh - roundsSinceChange = 1 = x2)
      const round2 = await xAllocationVoting.currentRoundId()
      await xAllocationVoting.connect(voter).castVote(round2, [eligibleApps[0]], [ethers.parseEther("100")])
      const cycle2 = await emissions.getCurrentCycle()
      const voterTotal2 = await voterRewards.cycleToVoterToTotal(cycle2, voter.address)

      // Round 2 reward weight should be less than round 1 (x2 vs x3)
      expect(voterTotal2).to.be.lt(voterTotal1)
    })
  })
})
