import { ethers } from "hardhat"
import { expect } from "chai"
import { describe, it, beforeEach } from "mocha"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { createLocalConfig } from "@repo/config/contracts/envs/local"

import { getOrDeployContractInstances } from "../helpers/deploy"
import { getVot3Tokens, bootstrapAndStartEmissions, waitForCurrentRoundToEnd } from "../helpers/common"
import { B3TR, VOT3, Treasury, NavigatorRegistry } from "../../typechain-types"

describe("NavigatorRegistry - @shard19a", function () {
  let navigatorRegistry: NavigatorRegistry
  let b3tr: B3TR
  let vot3: VOT3
  let treasury: Treasury
  let owner: HardhatEthersSigner
  let otherAccount: HardhatEthersSigner
  let minterAccount: HardhatEthersSigner
  let otherAccounts: HardhatEthersSigner[]

  const config = createLocalConfig()
  const STAKE_AMOUNT = ethers.parseEther("50000")
  const METADATA_URI = "ipfs://navigator-metadata"

  // Ensure VOT3 supply exists so max stake calculation is non-zero
  const ensureVot3Supply = async () => {
    const supply = await vot3.totalSupply()
    if (supply === 0n) {
      // Mint and convert enough B3TR -> VOT3 to create supply
      await getVot3Tokens(owner, "10000000")
    }
  }

  // Helper: mint B3TR for account and approve NavigatorRegistry
  const fundAndApprove = async (account: HardhatEthersSigner, amount: bigint) => {
    await b3tr.connect(minterAccount).mint(account.address, amount)
    const registryAddress = await navigatorRegistry.getAddress()
    await b3tr.connect(account).approve(registryAddress, amount)
  }

  // Helper: register a navigator with default stake (ensures VOT3 supply first)
  const registerNavigator = async (account: HardhatEthersSigner, amount: bigint = STAKE_AMOUNT, uri = METADATA_URI) => {
    await ensureVot3Supply()
    await fundAndApprove(account, amount)
    await navigatorRegistry.connect(account).register(amount, uri)
  }

  beforeEach(async function () {
    const deployment = await getOrDeployContractInstances({ forceDeploy: true })
    if (!deployment) throw new Error("Failed to deploy contracts")

    navigatorRegistry = deployment.navigatorRegistry
    b3tr = deployment.b3tr
    vot3 = deployment.vot3
    treasury = deployment.treasury
    owner = deployment.owner
    otherAccount = deployment.otherAccount
    minterAccount = deployment.minterAccount
    otherAccounts = deployment.otherAccounts
  })

  // ======================== 1. Initialization ======================== //

  describe("Initialization", function () {
    it("version() returns '1'", async function () {
      expect(await navigatorRegistry.version()).to.equal("1")
    })

    it("BASIS_POINTS returns 10000", async function () {
      expect(await navigatorRegistry.BASIS_POINTS()).to.equal(10000n)
    })

    it("getMinStake returns config value", async function () {
      expect(await navigatorRegistry.getMinStake()).to.equal(config.NAVIGATOR_MIN_STAKE)
    })

    it("getFeeLockPeriod returns config value", async function () {
      expect(await navigatorRegistry.getFeeLockPeriod()).to.equal(config.NAVIGATOR_FEE_LOCK_PERIOD)
    })

    it("getFeePercentage returns config value", async function () {
      expect(await navigatorRegistry.getFeePercentage()).to.equal(config.NAVIGATOR_FEE_PERCENTAGE)
    })

    it("getReportInterval returns config value", async function () {
      expect(await navigatorRegistry.getReportInterval()).to.equal(config.NAVIGATOR_REPORT_INTERVAL)
    })

    it("getMinorSlashPercentage returns config value", async function () {
      expect(await navigatorRegistry.getMinorSlashPercentage()).to.equal(config.NAVIGATOR_MINOR_SLASH_PERCENTAGE)
    })

    it("getPreferenceCutoffPeriod returns config value", async function () {
      expect(await navigatorRegistry.getPreferenceCutoffPeriod()).to.equal(config.NAVIGATOR_PREFERENCE_CUTOFF_PERIOD)
    })

    it("should not allow reinitialization", async function () {
      await expect(
        navigatorRegistry.initialize({
          admin: owner.address,
          upgrader: owner.address,
          governance: owner.address,
          b3trToken: await b3tr.getAddress(),
          vot3Token: await vot3.getAddress(),
          treasury: await treasury.getAddress(),
          minStake: STAKE_AMOUNT,
          maxStakePercentage: 100,
          feeLockPeriod: 4,
          feePercentage: 2000,
          exitNoticePeriod: 1,
          reportInterval: 2,
          minorSlashPercentage: 1000,
          preferenceCutoffPeriod: 8640,
          voterRewards: owner.address,
          xAllocationVoting: owner.address,
        }),
      ).to.be.reverted
    })
  })

  // ======================== 2. Registration & Staking ======================== //

  describe("Registration & Staking", function () {
    describe("register()", function () {
      it("should register a navigator with correct stake, metadata, and emit event", async function () {
        const navigator = otherAccounts[10]
        await ensureVot3Supply()
        await fundAndApprove(navigator, STAKE_AMOUNT)

        const tx = await navigatorRegistry.connect(navigator).register(STAKE_AMOUNT, METADATA_URI)

        expect(await navigatorRegistry.isNavigator(navigator.address)).to.be.true
        expect(await navigatorRegistry.getStake(navigator.address)).to.equal(STAKE_AMOUNT)
        expect(await navigatorRegistry.getMetadataURI(navigator.address)).to.equal(METADATA_URI)

        await expect(tx)
          .to.emit(navigatorRegistry, "NavigatorRegistered")
          .withArgs(navigator.address, STAKE_AMOUNT, METADATA_URI)
      })

      it("should revert with StakeBelowMinimum when stake is below minimum", async function () {
        const navigator = otherAccounts[10]
        const lowStake = ethers.parseEther("100")
        await fundAndApprove(navigator, lowStake)

        await expect(
          navigatorRegistry.connect(navigator).register(lowStake, METADATA_URI),
        ).to.be.revertedWithCustomError(navigatorRegistry, "StakeBelowMinimum")
      })

      it("should revert with AlreadyRegistered when registering twice", async function () {
        const navigator = otherAccounts[10]
        await registerNavigator(navigator)

        // Fund again and try to register a second time
        await fundAndApprove(navigator, STAKE_AMOUNT)

        await expect(
          navigatorRegistry.connect(navigator).register(STAKE_AMOUNT, METADATA_URI),
        ).to.be.revertedWithCustomError(navigatorRegistry, "AlreadyRegistered")
      })

      it("should revert with DelegatorCannotRegister when caller is currently delegating", async function () {
        const existingNavigator = otherAccounts[10]
        const delegator = otherAccounts[11]

        await registerNavigator(existingNavigator)

        // delegator gets VOT3 and delegates to the existing navigator
        await getVot3Tokens(delegator, "1000")
        await navigatorRegistry.connect(delegator).delegate(existingNavigator.address, ethers.parseEther("500"))

        // delegator tries to register as a navigator while still delegating
        await fundAndApprove(delegator, STAKE_AMOUNT)
        await expect(
          navigatorRegistry.connect(delegator).register(STAKE_AMOUNT, METADATA_URI),
        ).to.be.revertedWithCustomError(navigatorRegistry, "DelegatorCannotRegister")
      })

      it("should allow registration after delegator undelegates", async function () {
        const existingNavigator = otherAccounts[10]
        const delegator = otherAccounts[11]

        await registerNavigator(existingNavigator)

        // delegator delegates then undelegates
        await getVot3Tokens(delegator, "1000")
        await navigatorRegistry.connect(delegator).delegate(existingNavigator.address, ethers.parseEther("500"))
        await navigatorRegistry.connect(delegator).undelegate()

        // Now registration should succeed
        await fundAndApprove(delegator, STAKE_AMOUNT)
        await navigatorRegistry.connect(delegator).register(STAKE_AMOUNT, METADATA_URI)

        expect(await navigatorRegistry.isNavigator(delegator.address)).to.be.true
      })

      it("should allow registration when previous navigator was deactivated (stale delegation)", async function () {
        const existingNavigator = otherAccounts[10]
        const delegator = otherAccounts[11]

        await registerNavigator(existingNavigator)

        // delegator delegates
        await getVot3Tokens(delegator, "1000")
        await navigatorRegistry.connect(delegator).delegate(existingNavigator.address, ethers.parseEther("500"))

        // Governance deactivates the navigator — delegation becomes stale
        await navigatorRegistry.connect(owner).deactivateNavigator(existingNavigator.address, 0, false)

        // Delegator should be able to register since their navigator is dead
        await fundAndApprove(delegator, STAKE_AMOUNT)
        await navigatorRegistry.connect(delegator).register(STAKE_AMOUNT, METADATA_URI)

        expect(await navigatorRegistry.isNavigator(delegator.address)).to.be.true
      })
    })

    describe("addStake()", function () {
      it("should increase stake and emit event", async function () {
        const navigator = otherAccounts[10]
        await registerNavigator(navigator)

        const additionalStake = ethers.parseEther("10000")
        await fundAndApprove(navigator, additionalStake)

        const tx = await navigatorRegistry.connect(navigator).addStake(additionalStake)
        const expectedTotal = STAKE_AMOUNT + additionalStake

        expect(await navigatorRegistry.getStake(navigator.address)).to.equal(expectedTotal)
        await expect(tx)
          .to.emit(navigatorRegistry, "StakeAdded")
          .withArgs(navigator.address, additionalStake, expectedTotal)
      })

      it("should revert when caller is not a navigator", async function () {
        const nonNavigator = otherAccounts[11]
        const amount = ethers.parseEther("10000")
        await fundAndApprove(nonNavigator, amount)

        await expect(navigatorRegistry.connect(nonNavigator).addStake(amount)).to.be.revertedWithCustomError(
          navigatorRegistry,
          "NotRegistered",
        )
      })
    })

    describe("withdrawStake()", function () {
      it("should allow withdrawal after exit is announced (exiting state)", async function () {
        const navigator = otherAccounts[10]
        await registerNavigator(navigator)

        // Need emissions started for currentRoundId to work
        await bootstrapAndStartEmissions()

        // Announce exit
        await navigatorRegistry.connect(navigator).announceExit()

        // Withdraw stake
        const tx = await navigatorRegistry.connect(navigator).withdrawStake(STAKE_AMOUNT)

        expect(await navigatorRegistry.getStake(navigator.address)).to.equal(0n)
        await expect(tx).to.emit(navigatorRegistry, "StakeWithdrawn").withArgs(navigator.address, STAKE_AMOUNT, 0n)
      })

      it("should revert with NavigatorStillActive when navigator has not announced exit", async function () {
        const navigator = otherAccounts[10]
        await registerNavigator(navigator)

        await expect(navigatorRegistry.connect(navigator).withdrawStake(STAKE_AMOUNT)).to.be.revertedWithCustomError(
          navigatorRegistry,
          "NavigatorStillActive",
        )
      })

      it("should revert with InsufficientStake when withdrawing more than staked", async function () {
        const navigator = otherAccounts[10]
        await registerNavigator(navigator)

        await bootstrapAndStartEmissions()
        await navigatorRegistry.connect(navigator).announceExit()

        const tooMuch = STAKE_AMOUNT + ethers.parseEther("1")
        await expect(navigatorRegistry.connect(navigator).withdrawStake(tooMuch)).to.be.revertedWithCustomError(
          navigatorRegistry,
          "InsufficientStake",
        )
      })
    })

    describe("reduceStake()", function () {
      it("should allow active navigator to reduce stake and emit StakeWithdrawn", async function () {
        const navigator = otherAccounts[10]
        const extraStake = ethers.parseEther("100000")
        await registerNavigator(navigator, extraStake)

        const reduceAmount = ethers.parseEther("10000")
        const remaining = extraStake - reduceAmount

        const tx = await navigatorRegistry.connect(navigator).reduceStake(reduceAmount)

        expect(await navigatorRegistry.getStake(navigator.address)).to.equal(remaining)
        await expect(tx)
          .to.emit(navigatorRegistry, "StakeWithdrawn")
          .withArgs(navigator.address, reduceAmount, remaining)
      })

      it("should revert with StakeBelowMinimum when reducing below min stake", async function () {
        const navigator = otherAccounts[10]
        const minStake = await navigatorRegistry.getMinStake()
        // Register with exactly min stake
        await registerNavigator(navigator, minStake)

        // Reducing by any amount should revert since we're at the minimum
        await expect(navigatorRegistry.connect(navigator).reduceStake(1n)).to.be.revertedWithCustomError(
          navigatorRegistry,
          "StakeBelowMinimum",
        )
      })

      it("should revert when reducing would break delegation capacity", async function () {
        const navigator = otherAccounts[10]
        // Register with extra stake so we can reduce
        const extraStake = ethers.parseEther("100000")
        await registerNavigator(navigator, extraStake)

        // Delegate close to capacity: 100K stake * 10 = 1M capacity, delegate 600K
        const citizen = otherAccounts[11]
        await getVot3Tokens(citizen, "600000")
        await navigatorRegistry.connect(citizen).delegate(navigator.address, ethers.parseEther("600000"))

        // Reducing 50K would leave 50K stake, capacity = 500K < 600K delegated
        await expect(
          navigatorRegistry.connect(navigator).reduceStake(ethers.parseEther("50000")),
        ).to.be.revertedWithCustomError(navigatorRegistry, "StakeBelowMinimum")
      })

      it("should revert with InsufficientStake when reducing more than staked", async function () {
        const navigator = otherAccounts[10]
        await registerNavigator(navigator)

        const tooMuch = STAKE_AMOUNT + ethers.parseEther("1")
        await expect(navigatorRegistry.connect(navigator).reduceStake(tooMuch)).to.be.revertedWithCustomError(
          navigatorRegistry,
          "InsufficientStake",
        )
      })

      it("should revert when caller is not a navigator", async function () {
        const nonNavigator = otherAccounts[11]
        await expect(
          navigatorRegistry.connect(nonNavigator).reduceStake(ethers.parseEther("1000")),
        ).to.be.revertedWithCustomError(navigatorRegistry, "NotRegistered")
      })
    })

    describe("Delegation Capacity", function () {
      it("getDelegationCapacity should be stake * 10", async function () {
        const navigator = otherAccounts[10]
        await registerNavigator(navigator)

        const capacity = await navigatorRegistry.getDelegationCapacity(navigator.address)
        expect(capacity).to.equal(STAKE_AMOUNT * 10n)
      })

      it("getRemainingCapacity should decrease after delegation", async function () {
        const navigator = otherAccounts[10]
        await registerNavigator(navigator)

        const citizen = otherAccounts[12]
        const delegateAmount = ethers.parseEther("100000") // 100k VOT3

        // Give citizen VOT3 tokens
        await getVot3Tokens(citizen, "100000")

        // Delegate
        await navigatorRegistry.connect(citizen).delegate(navigator.address, delegateAmount)

        const remaining = await navigatorRegistry.getRemainingCapacity(navigator.address)
        const expectedRemaining = STAKE_AMOUNT * 10n - delegateAmount
        expect(remaining).to.equal(expectedRemaining)
      })
    })
  })

  // ======================== 3. Governance Setters ======================== //

  describe("Governance Setters", function () {
    // ---- Numeric setters with GOVERNANCE_ROLE ---- //

    describe("setMinStake", function () {
      it("should update minStake", async function () {
        const newValue = ethers.parseEther("100000")
        await navigatorRegistry.connect(owner).setMinStake(newValue)
        expect(await navigatorRegistry.getMinStake()).to.equal(newValue)
      })

      it("should revert with InvalidParameter when value is 0", async function () {
        await expect(navigatorRegistry.connect(owner).setMinStake(0)).to.be.revertedWithCustomError(
          navigatorRegistry,
          "InvalidParameter",
        )
      })

      it("should revert when caller lacks GOVERNANCE_ROLE", async function () {
        await expect(navigatorRegistry.connect(otherAccount).setMinStake(1)).to.be.reverted
      })
    })

    describe("setMaxStakePercentage", function () {
      it("should update maxStakePercentage", async function () {
        // Create some VOT3 supply so getMaxStake returns non-zero
        await getVot3Tokens(owner, "1000000")

        await navigatorRegistry.connect(owner).setMaxStakePercentage(500)
        const maxStake = await navigatorRegistry.getMaxStake()
        expect(maxStake).to.be.gt(0n)
      })

      it("should revert with InvalidParameter when value is 0", async function () {
        await expect(navigatorRegistry.connect(owner).setMaxStakePercentage(0)).to.be.revertedWithCustomError(
          navigatorRegistry,
          "InvalidParameter",
        )
      })

      it("should revert with InvalidParameter when value exceeds BASIS_POINTS", async function () {
        await expect(navigatorRegistry.connect(owner).setMaxStakePercentage(10001)).to.be.revertedWithCustomError(
          navigatorRegistry,
          "InvalidParameter",
        )
      })

      it("should revert when caller lacks GOVERNANCE_ROLE", async function () {
        await expect(navigatorRegistry.connect(otherAccount).setMaxStakePercentage(500)).to.be.reverted
      })
    })

    describe("setFeeLockPeriod", function () {
      it("should update feeLockPeriod", async function () {
        await navigatorRegistry.connect(owner).setFeeLockPeriod(8)
        expect(await navigatorRegistry.getFeeLockPeriod()).to.equal(8)
      })

      it("should revert with InvalidParameter when value is 0", async function () {
        await expect(navigatorRegistry.connect(owner).setFeeLockPeriod(0)).to.be.revertedWithCustomError(
          navigatorRegistry,
          "InvalidParameter",
        )
      })

      it("should revert when caller lacks GOVERNANCE_ROLE", async function () {
        await expect(navigatorRegistry.connect(otherAccount).setFeeLockPeriod(8)).to.be.reverted
      })
    })

    describe("setFeePercentage", function () {
      it("should update feePercentage", async function () {
        await navigatorRegistry.connect(owner).setFeePercentage(3000)
        expect(await navigatorRegistry.getFeePercentage()).to.equal(3000)
      })

      it("should revert with InvalidParameter when value exceeds BASIS_POINTS", async function () {
        await expect(navigatorRegistry.connect(owner).setFeePercentage(10001)).to.be.revertedWithCustomError(
          navigatorRegistry,
          "InvalidParameter",
        )
      })

      it("should revert when caller lacks GOVERNANCE_ROLE", async function () {
        await expect(navigatorRegistry.connect(otherAccount).setFeePercentage(3000)).to.be.reverted
      })
    })

    describe("setReportInterval", function () {
      it("should update reportInterval", async function () {
        await navigatorRegistry.connect(owner).setReportInterval(5)
        expect(await navigatorRegistry.getReportInterval()).to.equal(5)
      })

      it("should revert with InvalidParameter when value is 0", async function () {
        await expect(navigatorRegistry.connect(owner).setReportInterval(0)).to.be.revertedWithCustomError(
          navigatorRegistry,
          "InvalidParameter",
        )
      })

      it("should revert when caller lacks GOVERNANCE_ROLE", async function () {
        await expect(navigatorRegistry.connect(otherAccount).setReportInterval(5)).to.be.reverted
      })
    })

    describe("setMinorSlashPercentage", function () {
      it("should update minorSlashPercentage", async function () {
        await navigatorRegistry.connect(owner).setMinorSlashPercentage(2000)
        expect(await navigatorRegistry.getMinorSlashPercentage()).to.equal(2000)
      })

      it("should revert with InvalidParameter when value is 0", async function () {
        await expect(navigatorRegistry.connect(owner).setMinorSlashPercentage(0)).to.be.revertedWithCustomError(
          navigatorRegistry,
          "InvalidParameter",
        )
      })

      it("should revert with InvalidParameter when value exceeds BASIS_POINTS", async function () {
        await expect(navigatorRegistry.connect(owner).setMinorSlashPercentage(10001)).to.be.revertedWithCustomError(
          navigatorRegistry,
          "InvalidParameter",
        )
      })

      it("should revert when caller lacks GOVERNANCE_ROLE", async function () {
        await expect(navigatorRegistry.connect(otherAccount).setMinorSlashPercentage(2000)).to.be.reverted
      })
    })

    describe("setPreferenceCutoffPeriod", function () {
      it("should update preferenceCutoffPeriod", async function () {
        await navigatorRegistry.connect(owner).setPreferenceCutoffPeriod(4320)
        expect(await navigatorRegistry.getPreferenceCutoffPeriod()).to.equal(4320)
      })

      it("should revert with InvalidParameter when value is 0", async function () {
        await expect(navigatorRegistry.connect(owner).setPreferenceCutoffPeriod(0)).to.be.revertedWithCustomError(
          navigatorRegistry,
          "InvalidParameter",
        )
      })

      it("should revert when caller lacks GOVERNANCE_ROLE", async function () {
        await expect(navigatorRegistry.connect(otherAccount).setPreferenceCutoffPeriod(4320)).to.be.reverted
      })
    })

    // ---- Address setters with DEFAULT_ADMIN_ROLE ---- //

    describe("setXAllocationVoting", function () {
      it("should update xAllocationVoting address", async function () {
        const newAddress = otherAccounts[13].address
        await navigatorRegistry.connect(owner).setXAllocationVoting(newAddress)
      })

      it("should revert with ZeroAddress when address is zero", async function () {
        await expect(
          navigatorRegistry.connect(owner).setXAllocationVoting(ethers.ZeroAddress),
        ).to.be.revertedWithCustomError(navigatorRegistry, "ZeroAddress")
      })

      it("should revert when caller lacks DEFAULT_ADMIN_ROLE", async function () {
        await expect(navigatorRegistry.connect(otherAccount).setXAllocationVoting(otherAccounts[13].address)).to.be
          .reverted
      })
    })

    describe("setRelayerRewardsPool", function () {
      it("should update relayerRewardsPool address", async function () {
        const newAddress = otherAccounts[14].address
        await navigatorRegistry.connect(owner).setRelayerRewardsPool(newAddress)
      })

      it("should revert with ZeroAddress when address is zero", async function () {
        await expect(
          navigatorRegistry.connect(owner).setRelayerRewardsPool(ethers.ZeroAddress),
        ).to.be.revertedWithCustomError(navigatorRegistry, "ZeroAddress")
      })

      it("should revert when caller lacks DEFAULT_ADMIN_ROLE", async function () {
        await expect(navigatorRegistry.connect(otherAccount).setRelayerRewardsPool(otherAccounts[14].address)).to.be
          .reverted
      })
    })

    describe("setVoterRewards", function () {
      it("should update voterRewards address", async function () {
        const newAddress = otherAccounts[15].address
        await navigatorRegistry.connect(owner).setVoterRewards(newAddress)
      })

      it("should revert with ZeroAddress when address is zero", async function () {
        await expect(
          navigatorRegistry.connect(owner).setVoterRewards(ethers.ZeroAddress),
        ).to.be.revertedWithCustomError(navigatorRegistry, "ZeroAddress")
      })

      it("should revert when caller lacks DEFAULT_ADMIN_ROLE", async function () {
        await expect(navigatorRegistry.connect(otherAccount).setVoterRewards(otherAccounts[15].address)).to.be.reverted
      })
    })
  })

  describe.only("getStatus()", function () {
    it("should return NONE (0) for unregistered address", async function () {
      const status = await navigatorRegistry.getStatus(otherAccounts[10].address)
      expect(status).to.equal(0n)
    })

    it("should return ACTIVE (1) after registration", async function () {
      const navigator = otherAccounts[10]
      await registerNavigator(navigator)

      const status = await navigatorRegistry.getStatus(navigator.address)
      expect(status).to.equal(1n)
    })

    it("should return EXITING (2) after announceExit while notice period is active", async function () {
      const navigator = otherAccounts[10]
      await registerNavigator(navigator)
      await bootstrapAndStartEmissions()

      await navigatorRegistry.connect(navigator).announceExit()

      const status = await navigatorRegistry.getStatus(navigator.address)
      expect(status).to.equal(2n)
    })

    it("should return DEACTIVATED (3) after notice period elapses", async function () {
      const navigator = otherAccounts[10]
      await registerNavigator(navigator)
      await bootstrapAndStartEmissions()

      await navigatorRegistry.connect(navigator).announceExit()
      expect(await navigatorRegistry.getStatus(navigator.address)).to.equal(2n)

      // Advance past exit notice period
      const exitNoticePeriod = await navigatorRegistry.getExitNoticePeriod()
      for (let i = 0; i <= Number(exitNoticePeriod); i++) {
        await waitForCurrentRoundToEnd()
      }

      const status = await navigatorRegistry.getStatus(navigator.address)
      expect(status).to.equal(3n)
    })

    it("should return DEACTIVATED (3) after governance deactivation", async function () {
      const navigator = otherAccounts[10]
      await registerNavigator(navigator)

      await navigatorRegistry.connect(owner).deactivateNavigator(navigator.address, 0, false)

      const status = await navigatorRegistry.getStatus(navigator.address)
      expect(status).to.equal(3n)
    })

    it("should return DEACTIVATED (3) for governance-deactivated even if exit was also announced", async function () {
      const navigator = otherAccounts[10]
      await registerNavigator(navigator)
      await bootstrapAndStartEmissions()

      await navigatorRegistry.connect(navigator).announceExit()
      expect(await navigatorRegistry.getStatus(navigator.address)).to.equal(2n)

      // Governance deactivates while exiting
      await navigatorRegistry.connect(owner).deactivateNavigator(navigator.address, 0, false)

      const status = await navigatorRegistry.getStatus(navigator.address)
      expect(status).to.equal(3n)
    })

    it("should still return ACTIVE (1) for an active navigator after another is deactivated", async function () {
      const nav1 = otherAccounts[10]
      const nav2 = otherAccounts[11]
      await registerNavigator(nav1)
      await registerNavigator(nav2)

      await navigatorRegistry.connect(owner).deactivateNavigator(nav1.address, 0, false)

      expect(await navigatorRegistry.getStatus(nav1.address)).to.equal(3n)
      expect(await navigatorRegistry.getStatus(nav2.address)).to.equal(1n)
    })
  })
})
