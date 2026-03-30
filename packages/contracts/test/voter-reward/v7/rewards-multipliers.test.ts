import { expect } from "chai"
import { ethers } from "hardhat"
import { describe, it, beforeEach } from "mocha"
import {
  bootstrapAndStartEmissions,
  createProposal,
  getOrDeployContractInstances,
  getVot3Tokens,
  waitForRoundToEnd,
  waitForNextCycle,
  waitForProposalToBeActive,
  getProposalIdFromTx,
} from "../../helpers"
import { endorseApp } from "../../helpers/xnodes"

// Helper: advance to next round (wait + distribute)
async function advanceToNextRound(roundId: number) {
  const { emissions, minterAccount } = contracts
  await waitForRoundToEnd(roundId)
  await waitForNextCycle()
  await emissions.connect(minterAccount).distribute()
}

// Shared test state
let contracts: any
let owner: any
let otherAccounts: any[]
let app1Id: string
let app2Id: string

// Helper: set production multipliers and enable passport whitelist check
async function setupMultipliers() {
  const { voterRewards, veBetterPassport } = contracts
  await voterRewards.connect(owner).grantRole(await voterRewards.GOVERNANCE_ROLE(), owner.address)
  await voterRewards.connect(owner).setFreshnessMultipliers(30000, 20000, 10000)
  await voterRewards.connect(owner).setIntentMultipliers(10000, 3000)

  // Enable whitelist check for personhood
  if (!(await veBetterPassport.isCheckEnabled(1))) {
    await veBetterPassport.connect(owner).toggleCheck(1)
  }
}

// Helper: create 2 endorsed apps (same pattern as VoterRewards.test.ts)
async function createEndorsedApps() {
  const { x2EarnApps, x2EarnCreator } = contracts

  // App 1: creator = otherAccounts[10]
  if ((await x2EarnCreator.balanceOf(otherAccounts[10].address)) === 0n) {
    await x2EarnCreator.connect(owner).safeMint(otherAccounts[10].address)
  }
  await x2EarnApps
    .connect(otherAccounts[10])
    .submitApp(otherAccounts[10].address, otherAccounts[10].address, "FreshApp1", "metadataURI")
  app1Id = await x2EarnApps.hashAppName("FreshApp1")
  await endorseApp(app1Id, otherAccounts[12])

  // App 2: creator = otherAccounts[11]
  if ((await x2EarnCreator.balanceOf(otherAccounts[11].address)) === 0n) {
    await x2EarnCreator.connect(owner).safeMint(otherAccounts[11].address)
  }
  await x2EarnApps
    .connect(otherAccounts[11])
    .submitApp(otherAccounts[11].address, otherAccounts[11].address, "FreshApp2", "metadataURI")
  app2Id = await x2EarnApps.hashAppName("FreshApp2")
  await endorseApp(app2Id, otherAccounts[13])
}

describe("Rewards Multipliers - @shard10b", function () {
  // ======================== Config Management ======================== //

  describe("Multiplier Config", function () {
    it("Should have neutral multiplier values after test deployment and allow setting production values", async () => {
      const { voterRewards, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      await voterRewards.connect(owner).grantRole(await voterRewards.GOVERNANCE_ROLE(), owner.address)

      const [ft1, ft2, ft3] = await voterRewards.getFreshnessMultipliers(0)
      expect(ft1).to.equal(10000n)
      expect(ft2).to.equal(10000n)
      expect(ft3).to.equal(10000n)

      const [ifa, iab] = await voterRewards.getIntentMultipliers(0)
      expect(ifa).to.equal(10000n)
      expect(iab).to.equal(10000n)

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
      await expect(voterRewards.connect(otherAccounts[5]).setFreshnessMultipliers(30000, 20000, 10000)).to.be.reverted
      await expect(voterRewards.connect(otherAccounts[5]).setIntentMultipliers(10000, 3000)).to.be.reverted
    })

    it("Should return MULTIPLIER_SCALE constant", async () => {
      const { voterRewards } = await getOrDeployContractInstances({ forceDeploy: true })
      expect(await voterRewards.MULTIPLIER_SCALE()).to.equal(10000n)
    })
  })

  // ======================== Freshness Multiplier ======================== //

  describe("Freshness Multiplier - Allocation Voting", function () {
    beforeEach(async function () {
      contracts = await getOrDeployContractInstances({ forceDeploy: true })
      owner = contracts.owner
      otherAccounts = contracts.otherAccounts
      const { veBetterPassport } = contracts
      await setupMultipliers()

      // Create and endorse apps BEFORE starting emissions so they're eligible in round 1
      await createEndorsedApps()

      // Mint tokens and whitelist voters BEFORE emissions start (so snapshot captures their balance)
      for (const acc of [otherAccounts[1], otherAccounts[2], otherAccounts[3]]) {
        await getVot3Tokens(acc, "100000")
        await veBetterPassport.connect(owner).whitelist(acc.address)
      }

      await bootstrapAndStartEmissions()
    })

    it("First-time voter should get tier 1 (x3) reward weight", async () => {
      const { xAllocationVoting, voterRewards, emissions, veBetterPassport } = contracts
      const voter = otherAccounts[1]
      await getVot3Tokens(voter, "1000")
      await veBetterPassport.connect(owner).whitelist(voter.address)

      const roundId = await xAllocationVoting.currentRoundId()
      await xAllocationVoting.connect(voter).castVote(roundId, [app1Id], [ethers.parseEther("100")])

      const cycle = await emissions.getCurrentCycle()
      const voterTotal = await voterRewards.cycleToVoterToTotal(cycle, voter.address)
      expect(voterTotal).to.be.gt(0n)
    })

    it("Voter with same apps in round 2 should get tier 2 (x2) — less than round 1", async () => {
      const { xAllocationVoting, voterRewards, emissions, veBetterPassport } = contracts
      const voter = otherAccounts[1]
      await getVot3Tokens(voter, "10000")
      await veBetterPassport.connect(owner).whitelist(voter.address)

      // Round 1: x3
      const round1 = await xAllocationVoting.currentRoundId()
      await xAllocationVoting.connect(voter).castVote(round1, [app1Id], [ethers.parseEther("100")])
      const cycle1 = await emissions.getCurrentCycle()
      const total1 = await voterRewards.cycleToVoterToTotal(cycle1, voter.address)

      await advanceToNextRound(Number(round1))

      // Round 2: same apps → x2
      const round2 = await xAllocationVoting.currentRoundId()
      await xAllocationVoting.connect(voter).castVote(round2, [app1Id], [ethers.parseEther("100")])
      const cycle2 = await emissions.getCurrentCycle()
      const total2 = await voterRewards.cycleToVoterToTotal(cycle2, voter.address)

      expect(total2).to.be.lt(total1)
    })

    it("Voter who changes apps in round 2 should get tier 1 (x3) again", async () => {
      const { xAllocationVoting, voterRewards, emissions, veBetterPassport } = contracts
      const voter = otherAccounts[1]
      await getVot3Tokens(voter, "10000")
      await veBetterPassport.connect(owner).whitelist(voter.address)

      // Round 1: app1 → x3
      const round1 = await xAllocationVoting.currentRoundId()
      await xAllocationVoting.connect(voter).castVote(round1, [app1Id], [ethers.parseEther("100")])
      const cycle1 = await emissions.getCurrentCycle()
      const total1 = await voterRewards.cycleToVoterToTotal(cycle1, voter.address)

      await advanceToNextRound(Number(round1))

      // Round 2: app2 → fingerprint changed → x3 again
      const round2 = await xAllocationVoting.currentRoundId()
      await xAllocationVoting.connect(voter).castVote(round2, [app2Id], [ethers.parseEther("100")])
      const cycle2 = await emissions.getCurrentCycle()
      const total2 = await voterRewards.cycleToVoterToTotal(cycle2, voter.address)

      // Both x3 → roughly equal
      const ratio = (total2 * 100n) / total1
      expect(ratio).to.be.gte(90n)
      expect(ratio).to.be.lte(110n)
    })

    it("Voter with same apps for 3+ rounds should get tier 3 (x1) — stale", async () => {
      const { xAllocationVoting, voterRewards, emissions, veBetterPassport } = contracts
      const voter = otherAccounts[1]
      await getVot3Tokens(voter, "10000")
      await veBetterPassport.connect(owner).whitelist(voter.address)

      // Round 1: x3
      const round1 = await xAllocationVoting.currentRoundId()
      await xAllocationVoting.connect(voter).castVote(round1, [app1Id], [ethers.parseEther("100")])
      const cycle1 = await emissions.getCurrentCycle()
      const total1 = await voterRewards.cycleToVoterToTotal(cycle1, voter.address)

      // Round 2: same → x2
      await advanceToNextRound(Number(round1))
      const round2 = await xAllocationVoting.currentRoundId()
      await xAllocationVoting.connect(voter).castVote(round2, [app1Id], [ethers.parseEther("100")])

      // Round 3: same → x1
      await advanceToNextRound(Number(round2))
      const round3 = await xAllocationVoting.currentRoundId()
      await xAllocationVoting.connect(voter).castVote(round3, [app1Id], [ethers.parseEther("100")])
      const cycle3 = await emissions.getCurrentCycle()
      const total3 = await voterRewards.cycleToVoterToTotal(cycle3, voter.address)

      // x1 < x3
      expect(total3).to.be.lt(total1)
    })

    it("XOR fingerprint is order-independent — [A,B] and [B,A] produce same multiplier", async () => {
      const { xAllocationVoting, voterRewards, emissions, veBetterPassport } = contracts
      const voter1 = otherAccounts[1]
      const voter2 = otherAccounts[2]
      await getVot3Tokens(voter1, "10000")
      await getVot3Tokens(voter2, "10000")
      await veBetterPassport.connect(owner).whitelist(voter1.address)
      await veBetterPassport.connect(owner).whitelist(voter2.address)

      const roundId = await xAllocationVoting.currentRoundId()

      // Voter1: [app1, app2]
      await xAllocationVoting
        .connect(voter1)
        .castVote(roundId, [app1Id, app2Id], [ethers.parseEther("50"), ethers.parseEther("50")])

      // Voter2: [app2, app1] — reversed
      await xAllocationVoting
        .connect(voter2)
        .castVote(roundId, [app2Id, app1Id], [ethers.parseEther("50"), ethers.parseEther("50")])

      const cycle = await emissions.getCurrentCycle()
      const total1 = await voterRewards.cycleToVoterToTotal(cycle, voter1.address)
      const total2 = await voterRewards.cycleToVoterToTotal(cycle, voter2.address)

      // Same fingerprint → same multiplier → same reward
      expect(total1).to.equal(total2)
    })

    it("Should emit FreshnessMultiplierApplied event with correct args", async () => {
      const { xAllocationVoting, veBetterPassport } = contracts
      const voter = otherAccounts[1]
      await getVot3Tokens(voter, "1000")
      await veBetterPassport.connect(owner).whitelist(voter.address)

      const roundId = await xAllocationVoting.currentRoundId()
      const tx = await xAllocationVoting.connect(voter).castVote(roundId, [app1Id], [ethers.parseEther("100")])
      const receipt = await tx.wait()

      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = xAllocationVoting.interface.parseLog({ topics: log.topics as string[], data: log.data })
          return parsed?.name === "FreshnessMultiplierApplied"
        } catch {
          return false
        }
      })

      expect(event).to.not.be.undefined
      const parsed = xAllocationVoting.interface.parseLog({ topics: event!.topics as string[], data: event!.data })
      expect(parsed?.args.voter).to.equal(voter.address)
      expect(parsed?.args.roundId).to.equal(roundId)
      expect(parsed?.args.multiplier).to.equal(30000n) // x3 first vote
    })

    it("hasUserVotedForApp should return correct values", async () => {
      const { xAllocationVoting, veBetterPassport } = contracts
      const voter = otherAccounts[1]
      await getVot3Tokens(voter, "1000")
      await veBetterPassport.connect(owner).whitelist(voter.address)

      const roundId = await xAllocationVoting.currentRoundId()

      // Before voting
      expect(await xAllocationVoting.hasUserVotedForApp(roundId, voter.address, app1Id)).to.be.false
      expect(await xAllocationVoting.hasUserVotedForApp(roundId, voter.address, app2Id)).to.be.false

      // Vote for app1 only
      await xAllocationVoting.connect(voter).castVote(roundId, [app1Id], [ethers.parseEther("100")])

      // After voting
      expect(await xAllocationVoting.hasUserVotedForApp(roundId, voter.address, app1Id)).to.be.true
      expect(await xAllocationVoting.hasUserVotedForApp(roundId, voter.address, app2Id)).to.be.false
    })

    it("Voter skips round 2, votes same apps in round 3 — should get stale multiplier", async () => {
      const { xAllocationVoting, voterRewards, emissions, veBetterPassport } = contracts
      const voter = otherAccounts[1]
      await getVot3Tokens(voter, "10000")
      await veBetterPassport.connect(owner).whitelist(voter.address)

      // Round 1: x3
      const round1 = await xAllocationVoting.currentRoundId()
      await xAllocationVoting.connect(voter).castVote(round1, [app1Id], [ethers.parseEther("100")])
      const cycle1 = await emissions.getCurrentCycle()
      const total1 = await voterRewards.cycleToVoterToTotal(cycle1, voter.address)

      // Skip round 2
      await advanceToNextRound(Number(round1))
      const round2 = await xAllocationVoting.currentRoundId()
      await advanceToNextRound(Number(round2))

      // Round 3: same apps → roundsSinceChange = 2 → x1
      const round3 = await xAllocationVoting.currentRoundId()
      await xAllocationVoting.connect(voter).castVote(round3, [app1Id], [ethers.parseEther("100")])
      const cycle3 = await emissions.getCurrentCycle()
      const total3 = await voterRewards.cycleToVoterToTotal(cycle3, voter.address)

      expect(total3).to.be.lt(total1)
    })
  })

  // ======================== Governance Intent Multiplier ======================== //

  describe("Governance Intent Multiplier - Proposal Voting", function () {
    beforeEach(async function () {
      contracts = await getOrDeployContractInstances({ forceDeploy: true })
      owner = contracts.owner
      otherAccounts = contracts.otherAccounts
      const { veBetterPassport } = contracts
      await setupMultipliers()

      // Create and endorse apps BEFORE starting emissions
      await createEndorsedApps()

      // Mint tokens and whitelist before emissions (proposer needs a lot for deposit threshold)
      for (const acc of [otherAccounts[0], otherAccounts[1], otherAccounts[2]]) {
        await getVot3Tokens(acc, "1000000")
        await veBetterPassport.connect(owner).whitelist(acc.address)
      }

      await bootstrapAndStartEmissions()
    })

    // Helper: create proposal, deposit, and wait for active
    async function createAndActivateProposal(proposer: any) {
      const { governor, b3tr, vot3 } = contracts
      const b3trContract = await ethers.getContractFactory("B3TR")

      const tx = await createProposal(b3tr, b3trContract, proposer, `intent test ${Date.now()}`)
      const proposalId = await getProposalIdFromTx(tx)

      // Deposit to meet threshold
      const depositThreshold = await governor.proposalDepositThreshold(proposalId)
      const currentDeposit = await governor.getProposalDeposits(proposalId)
      if (currentDeposit < depositThreshold) {
        const remaining = depositThreshold - currentDeposit
        await vot3.connect(proposer).approve(await governor.getAddress(), remaining)
        await governor.connect(proposer).deposit(remaining, proposalId)
      }

      await waitForProposalToBeActive(proposalId)
      return proposalId
    }

    it("For vote should get full (x1) reward weight", async () => {
      const { governor, voterRewards, emissions } = contracts
      const proposer = otherAccounts[0]
      const voter = otherAccounts[1]

      const proposalId = await createAndActivateProposal(proposer)

      await governor.connect(voter).castVote(proposalId, 1) // For

      const cycle = await emissions.getCurrentCycle()
      const voterTotal = await voterRewards.cycleToVoterToTotal(cycle, voter.address)
      expect(voterTotal).to.be.gt(0n)
    })

    it("Against vote should get same reward as For", async () => {
      const { governor, voterRewards, emissions } = contracts
      const proposer = otherAccounts[0]
      const voterFor = otherAccounts[1]
      const voterAgainst = otherAccounts[2]

      const proposalId = await createAndActivateProposal(proposer)

      await governor.connect(voterFor).castVote(proposalId, 1) // For
      await governor.connect(voterAgainst).castVote(proposalId, 0) // Against

      const cycle = await emissions.getCurrentCycle()
      const totalFor = await voterRewards.cycleToVoterToTotal(cycle, voterFor.address)
      const totalAgainst = await voterRewards.cycleToVoterToTotal(cycle, voterAgainst.address)

      expect(totalFor).to.equal(totalAgainst)
    })

    it("Abstain vote should get reduced reward weight compared to For", async () => {
      const { governor, voterRewards, emissions } = contracts
      const proposer = otherAccounts[0]
      const voterFor = otherAccounts[1]
      const voterAbstain = otherAccounts[2]

      const proposalId = await createAndActivateProposal(proposer)

      await governor.connect(voterFor).castVote(proposalId, 1) // For → x1
      await governor.connect(voterAbstain).castVote(proposalId, 2) // Abstain → x0.30

      const cycle = await emissions.getCurrentCycle()
      const totalFor = await voterRewards.cycleToVoterToTotal(cycle, voterFor.address)
      const totalAbstain = await voterRewards.cycleToVoterToTotal(cycle, voterAbstain.address)

      expect(totalAbstain).to.be.lt(totalFor)
    })
  })

  // ======================== Checkpoint Behavior ======================== //

  describe("Checkpoint Behavior", function () {
    it("Multiplier change mid-round should not affect current round votes", async () => {
      contracts = await getOrDeployContractInstances({ forceDeploy: true })
      owner = contracts.owner
      otherAccounts = contracts.otherAccounts

      const { xAllocationVoting, voterRewards, emissions, veBetterPassport } = contracts
      await voterRewards.connect(owner).grantRole(await voterRewards.GOVERNANCE_ROLE(), owner.address)
      // Set initial multiplier before rounds start
      await voterRewards.connect(owner).setFreshnessMultipliers(20000, 15000, 10000)

      await createEndorsedApps()

      // Enable whitelist check
      if (!(await veBetterPassport.isCheckEnabled(1))) {
        await veBetterPassport.connect(owner).toggleCheck(1)
      }

      const voter1 = otherAccounts[1]
      const voter2 = otherAccounts[2]
      await getVot3Tokens(voter1, "100000")
      await getVot3Tokens(voter2, "100000")
      await veBetterPassport.connect(owner).whitelist(voter1.address)
      await veBetterPassport.connect(owner).whitelist(voter2.address)

      await bootstrapAndStartEmissions()

      const roundId = await xAllocationVoting.currentRoundId()

      // Voter1 votes before change
      await xAllocationVoting.connect(voter1).castVote(roundId, [app1Id], [ethers.parseEther("100")])

      // Change multiplier mid-round
      await voterRewards.connect(owner).setFreshnessMultipliers(50000, 30000, 10000)

      // Voter2 votes after change
      await xAllocationVoting.connect(voter2).castVote(roundId, [app1Id], [ethers.parseEther("100")])

      const cycle = await emissions.getCurrentCycle()
      const total1 = await voterRewards.cycleToVoterToTotal(cycle, voter1.address)
      const total2 = await voterRewards.cycleToVoterToTotal(cycle, voter2.address)

      // Both should use the value at round snapshot → same reward
      expect(total1).to.equal(total2)
    })
  })

  // ======================== Upgrade Safety ======================== //

  describe("Upgrade Safety", function () {
    it("VoterRewards V7 should preserve version and functions after upgrade chain", async () => {
      const { voterRewards } = await getOrDeployContractInstances({ forceDeploy: true })
      expect(await voterRewards.version()).to.equal("7")

      const [t1, t2, t3] = await voterRewards.getFreshnessMultipliers(0)
      expect(t1).to.be.gte(10000n)

      const [fa, ab] = await voterRewards.getIntentMultipliers(0)
      expect(fa).to.be.gte(10000n)
    })
  })
})
