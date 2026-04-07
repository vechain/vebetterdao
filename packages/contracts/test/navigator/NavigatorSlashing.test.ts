import { ethers } from "hardhat"
import { expect } from "chai"
import { describe, it, beforeEach } from "mocha"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"

import { getOrDeployContractInstances } from "../helpers/deploy"
import { bootstrapAndStartEmissions, getVot3Tokens, waitForRoundToEnd, moveBlocks } from "../helpers/common"
import { B3TR, NavigatorRegistry, XAllocationVoting, Emissions, Treasury } from "../../typechain-types"

describe("NavigatorRegistry Slashing - @shard19e", function () {
  let navigatorRegistry: NavigatorRegistry
  let b3tr: B3TR
  let xAllocationVoting: XAllocationVoting
  let emissions: Emissions
  let treasury: Treasury
  let owner: HardhatEthersSigner
  let minterAccount: HardhatEthersSigner
  let otherAccounts: HardhatEthersSigner[]
  let navigator1: HardhatEthersSigner
  let citizen1: HardhatEthersSigner

  const STAKE_AMOUNT = ethers.parseEther("50000")
  const METADATA_URI = "ipfs://navigator-metadata"
  const app1 = ethers.keccak256(ethers.toUtf8Bytes("App1"))
  const app2 = ethers.keccak256(ethers.toUtf8Bytes("App2"))

  // Helper: fund account with B3TR (via owner) and approve NavigatorRegistry
  const fundAndApprove = async (account: HardhatEthersSigner, amount: bigint) => {
    await b3tr.connect(owner).transfer(account.address, amount)
    const registryAddress = await navigatorRegistry.getAddress()
    await b3tr.connect(account).approve(registryAddress, amount)
  }

  // Helper: register a navigator with default stake
  const registerNavigator = async (account: HardhatEthersSigner, amount: bigint = STAKE_AMOUNT) => {
    await fundAndApprove(account, amount)
    await navigatorRegistry.connect(account).register(amount, METADATA_URI)
  }

  // Helper: delegate citizen to navigator (gets VOT3 tokens first)
  const delegateCitizen = async (
    citizen: HardhatEthersSigner,
    navigator: HardhatEthersSigner,
    amount: string = "1000",
  ) => {
    await getVot3Tokens(citizen, amount)
    await navigatorRegistry.connect(citizen).delegate(navigator.address, ethers.parseEther(amount))
  }

  // Helper: advance N allocation rounds
  const advanceRounds = async (count: number) => {
    for (let i = 0; i < count; i++) {
      const roundId = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(roundId))
      await emissions.distribute()
    }
  }

  beforeEach(async function () {
    const deployment = await getOrDeployContractInstances({ forceDeploy: true })
    if (!deployment) throw new Error("Failed to deploy contracts")

    navigatorRegistry = deployment.navigatorRegistry
    b3tr = deployment.b3tr
    xAllocationVoting = deployment.xAllocationVoting
    emissions = deployment.emissions
    treasury = deployment.treasury
    owner = deployment.owner
    minterAccount = deployment.minterAccount
    otherAccounts = deployment.otherAccounts

    navigator1 = otherAccounts[10]
    citizen1 = otherAccounts[11]

    // Mint B3TR to owner for transfers
    await b3tr.connect(minterAccount).mint(owner.address, ethers.parseEther("10000000"))

    // Create VOT3 supply (max stake = 1% of VOT3 supply, need >= 5M VOT3 for 50k stake)
    await getVot3Tokens(otherAccounts[15], "10000000")

    // Register navigator
    await registerNavigator(navigator1)
  })

  // ======================== 1. reportMissedAllocationVote ======================== //

  describe("reportMissedAllocationVote()", function () {
    it("should slash navigator who has citizens but no preferences for round", async function () {
      await delegateCitizen(citizen1, navigator1)

      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      // Navigator does NOT set preferences — end round
      await waitForRoundToEnd(Number(roundId))

      const stakeBefore = await navigatorRegistry.getStake(navigator1.address)
      await navigatorRegistry.reportMissedAllocationVote(navigator1.address, roundId)
      const stakeAfter = await navigatorRegistry.getStake(navigator1.address)

      // 10% of 50000 = 5000 slashed
      const expectedSlash = (stakeBefore * 1000n) / 10000n
      expect(stakeAfter).to.equal(stakeBefore - expectedSlash)
    })

    it("should revert NoInfractionFound when navigator has no citizens", async function () {
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(roundId))

      await expect(
        navigatorRegistry.reportMissedAllocationVote(navigator1.address, roundId),
      ).to.be.revertedWithCustomError(navigatorRegistry, "NoInfractionFound")
    })

    it("should revert NoInfractionFound when preferences already set", async function () {
      await delegateCitizen(citizen1, navigator1)

      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      // Navigator sets preferences
      await navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [app1, app2], [6000, 4000])

      await waitForRoundToEnd(Number(roundId))

      await expect(
        navigatorRegistry.reportMissedAllocationVote(navigator1.address, roundId),
      ).to.be.revertedWithCustomError(navigatorRegistry, "NoInfractionFound")
    })

    it("should revert AlreadySlashed when already slashed for this round", async function () {
      await delegateCitizen(citizen1, navigator1)

      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(roundId))

      // First slash succeeds
      await navigatorRegistry.reportMissedAllocationVote(navigator1.address, roundId)

      // Second slash reverts
      await expect(
        navigatorRegistry.reportMissedAllocationVote(navigator1.address, roundId),
      ).to.be.revertedWithCustomError(navigatorRegistry, "AlreadySlashed")
    })
  })

  // ======================== 2. reportMissedGovernanceVote ======================== //

  describe("reportMissedGovernanceVote()", function () {
    it("should slash navigator who has citizens but no decision for proposal", async function () {
      await delegateCitizen(citizen1, navigator1)

      const stakeBefore = await navigatorRegistry.getStake(navigator1.address)
      const fakeProposalId = 999n

      await navigatorRegistry.reportMissedGovernanceVote(navigator1.address, fakeProposalId)

      const stakeAfter = await navigatorRegistry.getStake(navigator1.address)
      const expectedSlash = (stakeBefore * 1000n) / 10000n
      expect(stakeAfter).to.equal(stakeBefore - expectedSlash)
    })

    it("should revert NoInfractionFound when navigator has no citizens", async function () {
      await expect(navigatorRegistry.reportMissedGovernanceVote(navigator1.address, 999)).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NoInfractionFound",
      )
    })

    it("should revert NoInfractionFound when decision is set", async function () {
      await delegateCitizen(citizen1, navigator1)

      const fakeProposalId = 999n
      // Navigator sets decision (2 = For)
      await navigatorRegistry.connect(navigator1).setProposalDecision(fakeProposalId, 2)

      await expect(
        navigatorRegistry.reportMissedGovernanceVote(navigator1.address, fakeProposalId),
      ).to.be.revertedWithCustomError(navigatorRegistry, "NoInfractionFound")
    })
  })

  // ======================== 3. reportStalePreferences ======================== //

  describe("reportStalePreferences()", function () {
    it("should slash when no preferences set in 3+ rounds", async function () {
      await delegateCitizen(citizen1, navigator1)

      // Start emissions, set prefs in round 1
      await bootstrapAndStartEmissions()
      const round1 = await xAllocationVoting.currentRoundId()
      await navigatorRegistry.connect(navigator1).setAllocationPreferences(round1, [app1], [10000])

      // Advance to round 4 without setting preferences
      await advanceRounds(3)

      const round4 = await xAllocationVoting.currentRoundId()
      const stakeBefore = await navigatorRegistry.getStake(navigator1.address)

      await navigatorRegistry.reportStalePreferences(navigator1.address, round4)

      const stakeAfter = await navigatorRegistry.getStake(navigator1.address)
      const expectedSlash = (stakeBefore * 1000n) / 10000n
      expect(stakeAfter).to.equal(stakeBefore - expectedSlash)
    })

    it("should revert NoInfractionFound when prefs set in recent round", async function () {
      await delegateCitizen(citizen1, navigator1)

      await bootstrapAndStartEmissions()
      const round1 = await xAllocationVoting.currentRoundId()
      await navigatorRegistry.connect(navigator1).setAllocationPreferences(round1, [app1], [10000])

      // Advance only 1 round
      await advanceRounds(1)
      const round2 = await xAllocationVoting.currentRoundId()

      await expect(navigatorRegistry.reportStalePreferences(navigator1.address, round2)).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NoInfractionFound",
      )
    })
  })

  // ======================== 4. reportMissedReport ======================== //

  describe("reportMissedReport()", function () {
    it("should slash when past reportInterval with citizens", async function () {
      await delegateCitizen(citizen1, navigator1)

      await bootstrapAndStartEmissions()

      // reportInterval is 2 by default. Advance 3+ rounds without submitting report.
      await advanceRounds(3)

      const currentRound = await xAllocationVoting.currentRoundId()
      const stakeBefore = await navigatorRegistry.getStake(navigator1.address)

      await navigatorRegistry.reportMissedReport(navigator1.address, currentRound)

      const stakeAfter = await navigatorRegistry.getStake(navigator1.address)
      const expectedSlash = (stakeBefore * 1000n) / 10000n
      expect(stakeAfter).to.equal(stakeBefore - expectedSlash)
    })

    it("should revert NoInfractionFound when report submitted recently", async function () {
      await delegateCitizen(citizen1, navigator1)

      await bootstrapAndStartEmissions()

      // Submit report in round 1
      await navigatorRegistry.connect(navigator1).submitReport("ipfs://report1")

      // Advance 1 round (within reportInterval of 2)
      await advanceRounds(1)
      const currentRound = await xAllocationVoting.currentRoundId()

      await expect(
        navigatorRegistry.reportMissedReport(navigator1.address, currentRound),
      ).to.be.revertedWithCustomError(navigatorRegistry, "NoInfractionFound")
    })
  })

  // ======================== 5. reportLatePreferences ======================== //

  describe("reportLatePreferences()", function () {
    it("should slash when preferences set after cutoff", async function () {
      await delegateCitizen(citizen1, navigator1)

      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      // Set cutoff to 2 blocks so it fits within our short test rounds
      await navigatorRegistry.connect(owner).setPreferenceCutoffPeriod(2)

      const deadline = await xAllocationVoting.roundDeadline(roundId)
      const cutoff = deadline - 2n

      // Advance to just past cutoff (deadline - 1 block = after cutoff)
      const currentBlock = await xAllocationVoting.clock()
      const blocksToAdvance = Number(cutoff - currentBlock) + 1
      if (blocksToAdvance > 0) {
        await moveBlocks(blocksToAdvance)
      }

      // Set preferences late (after cutoff)
      await navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [app1], [10000])

      await waitForRoundToEnd(Number(roundId))

      const stakeBefore = await navigatorRegistry.getStake(navigator1.address)
      await navigatorRegistry.reportLatePreferences(navigator1.address, roundId)
      const stakeAfter = await navigatorRegistry.getStake(navigator1.address)

      const expectedSlash = (stakeBefore * 1000n) / 10000n
      expect(stakeAfter).to.equal(stakeBefore - expectedSlash)
    })

    it("should revert NoInfractionFound when preferences set before cutoff", async function () {
      await delegateCitizen(citizen1, navigator1)

      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      // Set cutoff to 2 blocks
      await navigatorRegistry.connect(owner).setPreferenceCutoffPeriod(2)

      // Set preferences immediately (well before cutoff)
      await navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [app1], [10000])

      await waitForRoundToEnd(Number(roundId))

      await expect(navigatorRegistry.reportLatePreferences(navigator1.address, roundId)).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NoInfractionFound",
      )
    })

    it("should revert NoInfractionFound when no preferences set at all", async function () {
      await delegateCitizen(citizen1, navigator1)

      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      await navigatorRegistry.connect(owner).setPreferenceCutoffPeriod(2)

      await waitForRoundToEnd(Number(roundId))

      // No prefs set — should use reportMissedAllocationVote instead
      await expect(navigatorRegistry.reportLatePreferences(navigator1.address, roundId)).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NoInfractionFound",
      )
    })
  })

  // ======================== 6. Minor slash compounding ======================== //

  describe("Minor slash compounding", function () {
    it("should compound: 50000 -> 45000 -> 40500", async function () {
      await delegateCitizen(citizen1, navigator1)

      await bootstrapAndStartEmissions()

      // First slash: 10% of 50000 = 5000
      const round1 = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(round1))
      await navigatorRegistry.reportMissedAllocationVote(navigator1.address, round1)
      expect(await navigatorRegistry.getStake(navigator1.address)).to.equal(ethers.parseEther("45000"))

      // Advance to next round
      await emissions.distribute()

      // Second slash: 10% of 45000 = 4500
      const round2 = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(round2))
      await navigatorRegistry.reportMissedAllocationVote(navigator1.address, round2)
      expect(await navigatorRegistry.getStake(navigator1.address)).to.equal(ethers.parseEther("40500"))
    })

    it("should disallow delegations when stake drops below minimum", async function () {
      await delegateCitizen(citizen1, navigator1)

      await bootstrapAndStartEmissions()

      // Slash repeatedly to drop below minStake (50000 default)
      // After 1 slash: 45000 < 50000 minStake => canAcceptDelegations = false
      const round1 = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(round1))
      await navigatorRegistry.reportMissedAllocationVote(navigator1.address, round1)

      expect(await navigatorRegistry.canAcceptDelegations(navigator1.address)).to.equal(false)
    })
  })

  // ======================== 7. deactivateNavigator / majorSlash ======================== //

  describe("deactivateNavigator() / majorSlash", function () {
    it("should revert when called by non-governance role", async function () {
      const nonGovernance = otherAccounts[14]

      await expect(navigatorRegistry.connect(nonGovernance).deactivateNavigator(navigator1.address, 5000, false)).to.be
        .reverted
    })

    it("should slash 50% of 50000 = 25000", async function () {
      await navigatorRegistry.connect(owner).deactivateNavigator(navigator1.address, 5000, false)

      expect(await navigatorRegistry.getStake(navigator1.address)).to.equal(ethers.parseEther("25000"))
      expect(await navigatorRegistry.isDeactivated(navigator1.address)).to.equal(true)
    })

    it("should forfeit fees when slashFees=true — claimFee reverts after deactivation", async function () {
      await delegateCitizen(citizen1, navigator1)

      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      // Deposit a fee via impersonation of VoterRewards
      const voterRewardsAddress = await (
        await getOrDeployContractInstances({ forceDeploy: false })
      ).voterRewards.getAddress()
      await ethers.provider.send("hardhat_impersonateAccount", [voterRewardsAddress])
      await ethers.provider.send("hardhat_setBalance", [voterRewardsAddress, "0x" + (10n ** 18n).toString(16)])
      const voterRewardsSigner = await ethers.getSigner(voterRewardsAddress)

      const registryAddress = await navigatorRegistry.getAddress()
      const feeAmount = ethers.parseEther("100")
      await b3tr.connect(owner).transfer(registryAddress, feeAmount)
      await navigatorRegistry.connect(voterRewardsSigner).depositNavigatorFee(navigator1.address, roundId, feeAmount)
      await ethers.provider.send("hardhat_stopImpersonatingAccount", [voterRewardsAddress])

      // Deactivate with fee slashing
      await navigatorRegistry.connect(owner).deactivateNavigator(navigator1.address, 5000, true)

      // claimFee reverts with NotRegistered (onlyNavigator modifier blocks deactivated navigators)
      await expect(navigatorRegistry.connect(navigator1).claimFee(roundId)).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NotRegistered",
      )
    })

    it("should slash 100% — stake becomes 0", async function () {
      await navigatorRegistry.connect(owner).deactivateNavigator(navigator1.address, 10000, false)

      expect(await navigatorRegistry.getStake(navigator1.address)).to.equal(0n)
      expect(await navigatorRegistry.isDeactivated(navigator1.address)).to.equal(true)
    })

    it("should deactivate with 0% slash — stake unchanged", async function () {
      await navigatorRegistry.connect(owner).deactivateNavigator(navigator1.address, 0, false)

      expect(await navigatorRegistry.getStake(navigator1.address)).to.equal(STAKE_AMOUNT)
      expect(await navigatorRegistry.isDeactivated(navigator1.address)).to.equal(true)
    })
  })

  // ======================== 8. Treasury verification ======================== //

  describe("Treasury verification", function () {
    it("should increase treasury B3TR balance by slashed amount", async function () {
      await delegateCitizen(citizen1, navigator1)

      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(roundId))

      // Capture treasury balance AFTER emissions (which change treasury balance)
      const treasuryAddress = await treasury.getAddress()
      const treasuryBefore = await b3tr.balanceOf(treasuryAddress)
      const stakeBefore = await navigatorRegistry.getStake(navigator1.address)
      const expectedSlash = (stakeBefore * 1000n) / 10000n

      await navigatorRegistry.reportMissedAllocationVote(navigator1.address, roundId)

      const treasuryAfter = await b3tr.balanceOf(treasuryAddress)
      expect(treasuryAfter - treasuryBefore).to.equal(expectedSlash)
    })
  })

  // ======================== 9. getTotalSlashed ======================== //

  describe("getTotalSlashed()", function () {
    it("should accumulate across multiple slashes", async function () {
      await delegateCitizen(citizen1, navigator1)

      await bootstrapAndStartEmissions()

      // First slash: 10% of 50000 = 5000
      const round1 = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(round1))
      await navigatorRegistry.reportMissedAllocationVote(navigator1.address, round1)
      const firstSlash = ethers.parseEther("5000")
      expect(await navigatorRegistry.getTotalSlashed(navigator1.address)).to.equal(firstSlash)

      // Second slash: 10% of 45000 = 4500
      await emissions.distribute()
      const round2 = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(round2))
      await navigatorRegistry.reportMissedAllocationVote(navigator1.address, round2)
      const secondSlash = ethers.parseEther("4500")
      expect(await navigatorRegistry.getTotalSlashed(navigator1.address)).to.equal(firstSlash + secondSlash)
    })
  })
})
