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

  const FLAG_MISSED_ALLOCATION = 1n
  const FLAG_LATE_PREFERENCES = 2n
  const FLAG_STALE_PREFERENCES = 4n
  const FLAG_MISSED_REPORT = 8n
  const FLAG_MISSED_GOVERNANCE = 16n

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

  describe("reportRoundInfractions()", function () {
    it("reverts when reporting an active round", async function () {
      await delegateCitizen(citizen1, navigator1)
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      await expect(
        navigatorRegistry.reportRoundInfractions(navigator1.address, roundId, []),
      ).to.be.revertedWithCustomError(navigatorRegistry, "RoundStillActive")
    })

    it("slashes once even when multiple infractions are true", async function () {
      await delegateCitizen(citizen1, navigator1)

      await bootstrapAndStartEmissions()
      await advanceRounds(2)

      const roundId = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(roundId))

      const stakeBefore = await navigatorRegistry.getStake(navigator1.address)
      await navigatorRegistry.reportRoundInfractions(navigator1.address, roundId, [999n])
      const stakeAfter = await navigatorRegistry.getStake(navigator1.address)

      const expectedSlash = (stakeBefore * 1000n) / 10000n
      expect(stakeAfter).to.equal(stakeBefore - expectedSlash)

      const [slashed, flags] = await navigatorRegistry.isSlashedForRound(navigator1.address, roundId)
      expect(slashed).to.equal(true)
      expect(flags).to.equal(
        FLAG_MISSED_ALLOCATION | FLAG_STALE_PREFERENCES | FLAG_MISSED_REPORT | FLAG_MISSED_GOVERNANCE,
      )
    })

    it("detects late preferences as infraction", async function () {
      await delegateCitizen(citizen1, navigator1)
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      await navigatorRegistry.connect(owner).setPreferenceCutoffPeriod(2)
      const deadline = await xAllocationVoting.roundDeadline(roundId)
      const cutoff = deadline - 2n
      const currentBlock = await xAllocationVoting.clock()
      const blocksToAdvance = Number(cutoff - currentBlock) + 1
      if (blocksToAdvance > 0) {
        await moveBlocks(blocksToAdvance)
      }

      await navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [app1], [10000])

      await waitForRoundToEnd(Number(roundId))
      await navigatorRegistry.reportRoundInfractions(navigator1.address, roundId, [])

      const [slashed, flags] = await navigatorRegistry.isSlashedForRound(navigator1.address, roundId)
      expect(slashed).to.equal(true)
      expect(flags).to.equal(FLAG_LATE_PREFERENCES)
    })

    it("reverts NoInfractionFound when no infraction exists", async function () {
      await delegateCitizen(citizen1, navigator1)
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()
      await navigatorRegistry.connect(owner).setPreferenceCutoffPeriod(2)

      await navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [app1], [10000])
      await waitForRoundToEnd(Number(roundId))

      await expect(
        navigatorRegistry.reportRoundInfractions(navigator1.address, roundId, []),
      ).to.be.revertedWithCustomError(navigatorRegistry, "NoInfractionFound")
    })

    it("reverts NoInfractionFound when navigator had no delegations", async function () {
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(roundId))
      await expect(
        navigatorRegistry.reportRoundInfractions(navigator1.address, roundId, []),
      ).to.be.revertedWithCustomError(navigatorRegistry, "NoInfractionFound")
    })

    it("reverts AlreadySlashed when reporting same round twice", async function () {
      await delegateCitizen(citizen1, navigator1)
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(roundId))

      await navigatorRegistry.reportRoundInfractions(navigator1.address, roundId, [])
      await expect(
        navigatorRegistry.reportRoundInfractions(navigator1.address, roundId, []),
      ).to.be.revertedWithCustomError(navigatorRegistry, "AlreadySlashed")
    })
  })

  describe("Minor slash compounding", function () {
    it("compounds across rounds: 50000 -> 45000 -> 40500", async function () {
      await delegateCitizen(citizen1, navigator1)
      await bootstrapAndStartEmissions()

      const round1 = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(round1))
      await navigatorRegistry.reportRoundInfractions(navigator1.address, round1, [])
      expect(await navigatorRegistry.getStake(navigator1.address)).to.equal(ethers.parseEther("45000"))

      await emissions.distribute()
      const round2 = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(round2))
      await navigatorRegistry.reportRoundInfractions(navigator1.address, round2, [])
      expect(await navigatorRegistry.getStake(navigator1.address)).to.equal(ethers.parseEther("40500"))

      const expectedTotal = ethers.parseEther("5000") + ethers.parseEther("4500")
      expect(await navigatorRegistry.getTotalSlashed(navigator1.address)).to.equal(expectedTotal)
    })
  })

  describe("Treasury verification", function () {
    it("increases treasury B3TR balance by slashed amount", async function () {
      await delegateCitizen(citizen1, navigator1)
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(roundId))

      const treasuryAddress = await treasury.getAddress()
      const treasuryBefore = await b3tr.balanceOf(treasuryAddress)
      const stakeBefore = await navigatorRegistry.getStake(navigator1.address)
      await navigatorRegistry.reportRoundInfractions(navigator1.address, roundId, [])
      const expectedSlash = (stakeBefore * 1000n) / 10000n
      const treasuryAfter = await b3tr.balanceOf(treasuryAddress)
      expect(treasuryAfter - treasuryBefore).to.equal(expectedSlash)
    })
  })

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
})
