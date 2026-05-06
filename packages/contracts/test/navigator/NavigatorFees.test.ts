import { ethers } from "hardhat"
import { expect } from "chai"
import { describe, it, beforeEach } from "mocha"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { createLocalConfig } from "@repo/config/contracts/envs/local"

import { getOrDeployContractInstances } from "../helpers/deploy"
import {
  bootstrapAndStartEmissions,
  getVot3Tokens,
  startNewAllocationRound,
  waitForRoundToEnd,
} from "../helpers/common"
import { B3TR, VoterRewards, NavigatorRegistry, Emissions, XAllocationVoting } from "../../typechain-types"

describe("NavigatorRegistry Fees - @shard19d", function () {
  let navigatorRegistry: NavigatorRegistry
  let b3tr: B3TR
  let voterRewards: VoterRewards
  let emissions: Emissions
  let xAllocationVoting: XAllocationVoting
  let owner: HardhatEthersSigner
  let otherAccounts: HardhatEthersSigner[]
  let minterAccount: HardhatEthersSigner

  const config = createLocalConfig()
  const STAKE_AMOUNT = ethers.parseEther("50000")
  const METADATA_URI = "ipfs://navigator-metadata"
  const FEE_AMOUNT = ethers.parseEther("100")

  // Helper: fund account with B3TR and approve NavigatorRegistry
  const fundAndApprove = async (account: HardhatEthersSigner, amount: bigint) => {
    await b3tr.connect(owner).transfer(account.address, amount)
    const registryAddress = await navigatorRegistry.getAddress()
    await b3tr.connect(account).approve(registryAddress, amount)
  }

  // Helper: register a navigator with default stake
  const registerNavigator = async (account: HardhatEthersSigner, amount: bigint = STAKE_AMOUNT, uri = METADATA_URI) => {
    await fundAndApprove(account, amount)
    await navigatorRegistry.connect(account).register(amount, uri)
  }

  // Helper: impersonate VoterRewards contract and deposit a fee
  const depositFeeViaImpersonation = async (navigator: string, roundId: number | bigint, amount: bigint) => {
    const voterRewardsAddress = await voterRewards.getAddress()
    await ethers.provider.send("hardhat_impersonateAccount", [voterRewardsAddress])
    await ethers.provider.send("hardhat_setBalance", [voterRewardsAddress, "0x" + (10n ** 18n).toString(16)])
    const voterRewardsSigner = await ethers.getSigner(voterRewardsAddress)

    // Transfer B3TR to NavigatorRegistry so it can pay out later
    const registryAddress = await navigatorRegistry.getAddress()
    await b3tr.connect(owner).transfer(registryAddress, amount)

    // Deposit fee
    await navigatorRegistry.connect(voterRewardsSigner).depositNavigatorFee(navigator, roundId, amount)

    await ethers.provider.send("hardhat_stopImpersonatingAccount", [voterRewardsAddress])
  }

  // Helper: advance N allocation rounds (requires emissions running)
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
    voterRewards = deployment.voterRewards
    emissions = deployment.emissions
    xAllocationVoting = deployment.xAllocationVoting
    owner = deployment.owner
    otherAccounts = deployment.otherAccounts
    minterAccount = deployment.minterAccount

    // Mint B3TR to owner for navigator registration transfers
    await b3tr.connect(minterAccount).mint(owner.address, ethers.parseEther("10000000"))

    // Create VOT3 supply (max stake = 1% of VOT3 supply, need >= 5M VOT3 for 50k stake)
    await getVot3Tokens(otherAccounts[15], "10000000")
  })

  // ======================== 1. depositNavigatorFee ======================== //

  describe("depositNavigatorFee", function () {
    it("should deposit fee and record it in getRoundFee", async function () {
      const navigator = otherAccounts[10]
      await registerNavigator(navigator)
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      await depositFeeViaImpersonation(navigator.address, roundId, FEE_AMOUNT)

      expect(await navigatorRegistry.getRoundFee(navigator.address, roundId)).to.equal(FEE_AMOUNT)
    })

    it("should revert when called by non-VoterRewards address", async function () {
      const navigator = otherAccounts[10]
      await registerNavigator(navigator)
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      await expect(
        navigatorRegistry.connect(owner).depositNavigatorFee(navigator.address, roundId, FEE_AMOUNT),
      ).to.be.revertedWithCustomError(navigatorRegistry, "UnauthorizedCaller")
    })

    it("should accumulate multiple deposits in the same round", async function () {
      const navigator = otherAccounts[10]
      await registerNavigator(navigator)
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      const firstDeposit = ethers.parseEther("50")
      const secondDeposit = ethers.parseEther("75")

      await depositFeeViaImpersonation(navigator.address, roundId, firstDeposit)
      await depositFeeViaImpersonation(navigator.address, roundId, secondDeposit)

      expect(await navigatorRegistry.getRoundFee(navigator.address, roundId)).to.equal(firstDeposit + secondDeposit)
    })

    it("should emit FeeDeposited event", async function () {
      const navigator = otherAccounts[10]
      await registerNavigator(navigator)
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      const voterRewardsAddress = await voterRewards.getAddress()
      await ethers.provider.send("hardhat_impersonateAccount", [voterRewardsAddress])
      await ethers.provider.send("hardhat_setBalance", [voterRewardsAddress, "0x" + (10n ** 18n).toString(16)])
      const voterRewardsSigner = await ethers.getSigner(voterRewardsAddress)

      const registryAddress = await navigatorRegistry.getAddress()
      await b3tr.connect(owner).transfer(registryAddress, FEE_AMOUNT)

      await expect(
        navigatorRegistry.connect(voterRewardsSigner).depositNavigatorFee(navigator.address, roundId, FEE_AMOUNT),
      )
        .to.emit(navigatorRegistry, "FeeDeposited")
        .withArgs(navigator.address, roundId, FEE_AMOUNT)

      await ethers.provider.send("hardhat_stopImpersonatingAccount", [voterRewardsAddress])
    })
  })

  // ======================== 2. claimFee ======================== //

  describe("claimFee", function () {
    it("should allow claiming after feeLockPeriod rounds", async function () {
      const navigator = otherAccounts[10]
      await registerNavigator(navigator)
      await bootstrapAndStartEmissions()

      const depositRoundId = await xAllocationVoting.currentRoundId()
      await depositFeeViaImpersonation(navigator.address, depositRoundId, FEE_AMOUNT)

      // Advance feeLockPeriod rounds (default 4)
      const lockPeriod = Number(await navigatorRegistry.getFeeLockPeriod())
      await advanceRounds(lockPeriod)

      const balanceBefore = await b3tr.balanceOf(navigator.address)
      await navigatorRegistry.connect(navigator).claimFee(depositRoundId)
      const balanceAfter = await b3tr.balanceOf(navigator.address)

      expect(balanceAfter - balanceBefore).to.equal(FEE_AMOUNT)
    })

    it("should revert when fees are still locked", async function () {
      const navigator = otherAccounts[10]
      await registerNavigator(navigator)
      await bootstrapAndStartEmissions()

      const depositRoundId = await xAllocationVoting.currentRoundId()
      await depositFeeViaImpersonation(navigator.address, depositRoundId, FEE_AMOUNT)

      // Advance only 2 rounds (less than feeLockPeriod of 4)
      await advanceRounds(2)

      await expect(navigatorRegistry.connect(navigator).claimFee(depositRoundId)).to.be.revertedWithCustomError(
        navigatorRegistry,
        "FeesStillLocked",
      )
    })

    it("should revert when no fees exist for the round", async function () {
      const navigator = otherAccounts[10]
      await registerNavigator(navigator)
      await bootstrapAndStartEmissions()

      const roundId = await xAllocationVoting.currentRoundId()

      // Advance past lock period with no deposited fees
      const lockPeriod = Number(await navigatorRegistry.getFeeLockPeriod())
      await advanceRounds(lockPeriod)

      await expect(navigatorRegistry.connect(navigator).claimFee(roundId)).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NoFeesToClaim",
      )
    })

    it("should revert when fees have been forfeited via deactivateNavigator with slashFees=true", async function () {
      const navigator = otherAccounts[10]
      await registerNavigator(navigator)
      await bootstrapAndStartEmissions()

      const depositRoundId = await xAllocationVoting.currentRoundId()
      await depositFeeViaImpersonation(navigator.address, depositRoundId, FEE_AMOUNT)

      // Governance deactivates navigator with fee forfeiture
      await navigatorRegistry.connect(owner).deactivateNavigator(navigator.address, 0, true)

      // Advance past lock period
      const lockPeriod = Number(await navigatorRegistry.getFeeLockPeriod())
      await advanceRounds(lockPeriod)

      // claimFee requires onlyNavigator, but navigator is deactivated => NotRegistered
      await expect(navigatorRegistry.connect(navigator).claimFee(depositRoundId)).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NotRegistered",
      )
    })

    it("should revert on double claim", async function () {
      const navigator = otherAccounts[10]
      await registerNavigator(navigator)
      await bootstrapAndStartEmissions()

      const depositRoundId = await xAllocationVoting.currentRoundId()
      await depositFeeViaImpersonation(navigator.address, depositRoundId, FEE_AMOUNT)

      const lockPeriod = Number(await navigatorRegistry.getFeeLockPeriod())
      await advanceRounds(lockPeriod)

      // First claim succeeds
      await navigatorRegistry.connect(navigator).claimFee(depositRoundId)

      // Second claim reverts
      await expect(navigatorRegistry.connect(navigator).claimFee(depositRoundId)).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NoFeesToClaim",
      )
    })

    it("should emit FeeClaimed event", async function () {
      const navigator = otherAccounts[10]
      await registerNavigator(navigator)
      await bootstrapAndStartEmissions()

      const depositRoundId = await xAllocationVoting.currentRoundId()
      await depositFeeViaImpersonation(navigator.address, depositRoundId, FEE_AMOUNT)

      const lockPeriod = Number(await navigatorRegistry.getFeeLockPeriod())
      await advanceRounds(lockPeriod)

      await expect(navigatorRegistry.connect(navigator).claimFee(depositRoundId))
        .to.emit(navigatorRegistry, "FeeClaimed")
        .withArgs(navigator.address, depositRoundId, FEE_AMOUNT)
    })

    it("should clear round fee after successful claim", async function () {
      const navigator = otherAccounts[10]
      await registerNavigator(navigator)
      await bootstrapAndStartEmissions()

      const depositRoundId = await xAllocationVoting.currentRoundId()
      await depositFeeViaImpersonation(navigator.address, depositRoundId, FEE_AMOUNT)

      const lockPeriod = Number(await navigatorRegistry.getFeeLockPeriod())
      await advanceRounds(lockPeriod)

      await navigatorRegistry.connect(navigator).claimFee(depositRoundId)

      expect(await navigatorRegistry.getRoundFee(navigator.address, depositRoundId)).to.equal(0n)
    })
  })

  // ======================== 3. View Functions ======================== //

  describe("View functions", function () {
    it("getFeeLockPeriod returns configured value", async function () {
      expect(await navigatorRegistry.getFeeLockPeriod()).to.equal(config.NAVIGATOR_FEE_LOCK_PERIOD)
    })

    it("getFeePercentage returns configured value", async function () {
      expect(await navigatorRegistry.getFeePercentage()).to.equal(config.NAVIGATOR_FEE_PERCENTAGE)
    })

    it("isRoundFeeUnlocked returns false when still locked", async function () {
      await bootstrapAndStartEmissions()
      const depositRoundId = await xAllocationVoting.currentRoundId()

      // Advance 2 rounds (less than lock period of 4)
      await advanceRounds(2)

      expect(await navigatorRegistry.isRoundFeeUnlocked(depositRoundId)).to.equal(false)
    })

    it("isRoundFeeUnlocked returns true after lock period", async function () {
      await bootstrapAndStartEmissions()
      const depositRoundId = await xAllocationVoting.currentRoundId()

      const lockPeriod = Number(await navigatorRegistry.getFeeLockPeriod())
      await advanceRounds(lockPeriod)

      expect(await navigatorRegistry.isRoundFeeUnlocked(depositRoundId)).to.equal(true)
    })

    it("getRoundFee returns 0 for rounds with no deposits", async function () {
      const navigator = otherAccounts[10]
      expect(await navigatorRegistry.getRoundFee(navigator.address, 999)).to.equal(0n)
    })
  })

  // ======================== 4. Governance Setters ======================== //

  describe("Governance setters", function () {
    it("should allow governance to update feeLockPeriod", async function () {
      const newPeriod = 8
      await navigatorRegistry.connect(owner).setFeeLockPeriod(newPeriod)
      expect(await navigatorRegistry.getFeeLockPeriod()).to.equal(newPeriod)
    })

    it("should revert setFeeLockPeriod with zero value", async function () {
      await expect(navigatorRegistry.connect(owner).setFeeLockPeriod(0)).to.be.revertedWithCustomError(
        navigatorRegistry,
        "InvalidParameter",
      )
    })

    it("should allow governance to update feePercentage", async function () {
      const newPercentage = 3000 // 30%
      await navigatorRegistry.connect(owner).setFeePercentage(newPercentage)
      expect(await navigatorRegistry.getFeePercentage()).to.equal(newPercentage)
    })

    it("should revert setFeePercentage with value exceeding basis points", async function () {
      await expect(navigatorRegistry.connect(owner).setFeePercentage(10001)).to.be.revertedWithCustomError(
        navigatorRegistry,
        "InvalidParameter",
      )
    })
  })
})
