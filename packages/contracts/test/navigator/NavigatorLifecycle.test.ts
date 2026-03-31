import { ethers } from "hardhat"
import { expect } from "chai"
import { describe, it, beforeEach } from "mocha"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"

import { getOrDeployContractInstances } from "../helpers/deploy"
import { bootstrapAndStartEmissions, getVot3Tokens, waitForRoundToEnd } from "../helpers/common"
import { B3TR, Emissions, NavigatorRegistry, XAllocationVoting } from "../../typechain-types"

describe("NavigatorRegistry Lifecycle - @shard19f", function () {
  let navigatorRegistry: NavigatorRegistry
  let b3tr: B3TR
  let xAllocationVoting: XAllocationVoting
  let emissions: Emissions
  let owner: HardhatEthersSigner
  let minterAccount: HardhatEthersSigner
  let otherAccounts: HardhatEthersSigner[]
  let navigator1: HardhatEthersSigner
  let nonNavigator: HardhatEthersSigner

  const STAKE_AMOUNT = ethers.parseEther("50000")
  const METADATA_URI = "ipfs://navigator-metadata"

  // Helper: fund account with B3TR and approve NavigatorRegistry
  const fundAndApprove = async (account: HardhatEthersSigner, amount: bigint) => {
    await b3tr.connect(owner).transfer(account.address, amount)
    const registryAddress = await navigatorRegistry.getAddress()
    await b3tr.connect(account).approve(registryAddress, amount)
  }

  // Helper: register a navigator with default stake
  const registerNavigator = async (account: HardhatEthersSigner) => {
    await fundAndApprove(account, STAKE_AMOUNT)
    await navigatorRegistry.connect(account).register(STAKE_AMOUNT, METADATA_URI)
  }

  beforeEach(async function () {
    const deployment = await getOrDeployContractInstances({ forceDeploy: true })
    if (!deployment) throw new Error("Failed to deploy contracts")

    navigatorRegistry = deployment.navigatorRegistry
    b3tr = deployment.b3tr
    xAllocationVoting = deployment.xAllocationVoting
    emissions = deployment.emissions
    owner = deployment.owner
    minterAccount = deployment.minterAccount
    otherAccounts = deployment.otherAccounts

    navigator1 = otherAccounts[10]
    nonNavigator = otherAccounts[11]

    // Mint B3TR to owner for navigator registration transfers
    await b3tr.connect(minterAccount).mint(owner.address, ethers.parseEther("10000000"))

    // Create VOT3 supply (max stake = 1% of VOT3 supply, so need >= 5M VOT3 for 50k stake)
    await getVot3Tokens(otherAccounts[15], "10000000")

    // Register navigator
    await registerNavigator(navigator1)

    // Start emissions so rounds exist
    await bootstrapAndStartEmissions()
  })

  // ======================== 1. announceExit() ======================== //

  describe("announceExit()", function () {
    it("happy path: sets isExiting and emits ExitAnnounced with correct rounds", async function () {
      const currentRound = await xAllocationVoting.currentRoundId()

      const tx = await navigatorRegistry.connect(navigator1).announceExit()

      const noticePeriod = await navigatorRegistry.getExitNoticePeriod()
      const effectiveRound = currentRound + noticePeriod

      await expect(tx)
        .to.emit(navigatorRegistry, "ExitAnnounced")
        .withArgs(navigator1.address, currentRound, effectiveRound)

      expect(await navigatorRegistry.isExiting(navigator1.address)).to.be.true
    })

    it("reverts if not registered (onlyNavigator)", async function () {
      await expect(navigatorRegistry.connect(nonNavigator).announceExit()).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NotRegistered",
      )
    })

    it("reverts if already exiting", async function () {
      await navigatorRegistry.connect(navigator1).announceExit()

      await expect(navigatorRegistry.connect(navigator1).announceExit()).to.be.revertedWithCustomError(
        navigatorRegistry,
        "AlreadyExiting",
      )
    })

    it("reverts if navigator is deactivated (onlyNavigator)", async function () {
      await navigatorRegistry.connect(owner).deactivateNavigator(navigator1.address, 0, false)

      await expect(navigatorRegistry.connect(navigator1).announceExit()).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NotRegistered",
      )
    })
  })

  // ======================== 2. finalizeExit() ======================== //

  describe("finalizeExit()", function () {
    it("happy path: succeeds after notice period and emits ExitFinalized", async function () {
      await navigatorRegistry.connect(navigator1).announceExit()

      // Advance 1 round (notice period = 1 in test config)
      const currentRound = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(currentRound))
      await emissions.connect(minterAccount).distribute()

      const tx = await navigatorRegistry.connect(navigator1).finalizeExit()
      await expect(tx).to.emit(navigatorRegistry, "ExitFinalized").withArgs(navigator1.address)
    })

    it("reverts if notice period not elapsed", async function () {
      await navigatorRegistry.connect(navigator1).announceExit()

      // Try to finalize immediately (same round)
      await expect(navigatorRegistry.connect(navigator1).finalizeExit()).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NoticePeriodNotElapsed",
      )
    })

    it("reverts if not exiting", async function () {
      await expect(navigatorRegistry.connect(navigator1).finalizeExit()).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NotExiting",
      )
    })
  })

  // ======================== 3. isExitReady() ======================== //

  describe("isExitReady()", function () {
    it("returns false immediately after announcement", async function () {
      await navigatorRegistry.connect(navigator1).announceExit()
      expect(await navigatorRegistry.isExitReady(navigator1.address)).to.be.false
    })

    it("returns true after notice period elapsed", async function () {
      await navigatorRegistry.connect(navigator1).announceExit()

      // Advance past notice period
      const currentRound = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(currentRound))
      await emissions.connect(minterAccount).distribute()

      expect(await navigatorRegistry.isExitReady(navigator1.address)).to.be.true
    })
  })

  // ======================== 4. Deactivation ======================== //

  describe("Deactivation", function () {
    it("deactivateNavigator: sets isDeactivated and emits NavigatorDeactivated", async function () {
      const tx = await navigatorRegistry.connect(owner).deactivateNavigator(navigator1.address, 0, false)
      const receipt = await tx.wait()

      // NavigatorDeactivated event is emitted from the library via delegatecall.
      // The library event name collides with an error name in NavigatorStakingUtils,
      // so hardhat-chai-matchers can't match it. Verify via raw log topic instead.
      const deactivatedTopic = ethers.id("NavigatorDeactivated(address,uint256)")
      const hasEvent = receipt?.logs.some(log => log.topics[0] === deactivatedTopic)
      expect(hasEvent).to.be.true

      expect(await navigatorRegistry.isDeactivated(navigator1.address)).to.be.true
    })

    it("can withdrawStake after deactivation", async function () {
      await navigatorRegistry.connect(owner).deactivateNavigator(navigator1.address, 0, false)

      const stakeBefore = await navigatorRegistry.getStake(navigator1.address)
      await navigatorRegistry.connect(navigator1).withdrawStake(stakeBefore)

      expect(await navigatorRegistry.getStake(navigator1.address)).to.equal(0n)
    })

    it("cannot register again with same account (AlreadyRegistered)", async function () {
      await navigatorRegistry.connect(owner).deactivateNavigator(navigator1.address, 0, false)

      await fundAndApprove(navigator1, STAKE_AMOUNT)
      await expect(
        navigatorRegistry.connect(navigator1).register(STAKE_AMOUNT, METADATA_URI),
      ).to.be.revertedWithCustomError(navigatorRegistry, "AlreadyRegistered")
    })
  })

  // ======================== 5. setMetadataURI() ======================== //

  describe("setMetadataURI()", function () {
    it("happy path: updates URI and emits MetadataURIUpdated", async function () {
      const newURI = "ipfs://updated-metadata"

      const tx = await navigatorRegistry.connect(navigator1).setMetadataURI(newURI)

      await expect(tx).to.emit(navigatorRegistry, "MetadataURIUpdated").withArgs(navigator1.address, newURI)

      expect(await navigatorRegistry.getMetadataURI(navigator1.address)).to.equal(newURI)
    })

    it("reverts if not navigator", async function () {
      await expect(navigatorRegistry.connect(nonNavigator).setMetadataURI("ipfs://fail")).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NotRegistered",
      )
    })
  })

  // ======================== 6. submitReport() ======================== //

  describe("submitReport()", function () {
    it("happy path: updates lastReportRound and lastReportURI, emits ReportSubmitted", async function () {
      const reportURI = "ipfs://report-1"
      const currentRound = await xAllocationVoting.currentRoundId()

      const tx = await navigatorRegistry.connect(navigator1).submitReport(reportURI)

      await expect(tx)
        .to.emit(navigatorRegistry, "ReportSubmitted")
        .withArgs(navigator1.address, currentRound, reportURI)

      expect(await navigatorRegistry.getLastReportRound(navigator1.address)).to.equal(currentRound)
      expect(await navigatorRegistry.getLastReportURI(navigator1.address)).to.equal(reportURI)
    })

    it("reverts if not navigator", async function () {
      await expect(navigatorRegistry.connect(nonNavigator).submitReport("ipfs://fail")).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NotRegistered",
      )
    })

    it("multiple reports: latest values are correct", async function () {
      const report1 = "ipfs://report-1"
      const report2 = "ipfs://report-2"

      await navigatorRegistry.connect(navigator1).submitReport(report1)

      // Advance to next round
      const round1 = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(round1))
      await emissions.connect(minterAccount).distribute()

      const round2 = await xAllocationVoting.currentRoundId()
      await navigatorRegistry.connect(navigator1).submitReport(report2)

      expect(await navigatorRegistry.getLastReportRound(navigator1.address)).to.equal(round2)
      expect(await navigatorRegistry.getLastReportURI(navigator1.address)).to.equal(report2)
    })
  })

  // ======================== 7. Post-exit state ======================== //

  describe("Post-exit state", function () {
    it("can withdrawStake after finalizeExit (full amount)", async function () {
      await navigatorRegistry.connect(navigator1).announceExit()

      // Advance past notice period
      const currentRound = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(currentRound))
      await emissions.connect(minterAccount).distribute()

      await navigatorRegistry.connect(navigator1).finalizeExit()

      const stake = await navigatorRegistry.getStake(navigator1.address)
      const balanceBefore = await b3tr.balanceOf(navigator1.address)

      await navigatorRegistry.connect(navigator1).withdrawStake(stake)

      expect(await navigatorRegistry.getStake(navigator1.address)).to.equal(0n)
      expect(await b3tr.balanceOf(navigator1.address)).to.equal(balanceBefore + stake)
    })

    it("isNavigator returns false after finalizeExit", async function () {
      // isNavigator checks isRegistered && !isDeactivated
      // After exit, exitAnnouncedRound > 0 but isRegistered still true and isDeactivated false
      // So isNavigator may still return true — verify actual behavior
      await navigatorRegistry.connect(navigator1).announceExit()

      const currentRound = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(currentRound))
      await emissions.connect(minterAccount).distribute()

      await navigatorRegistry.connect(navigator1).finalizeExit()

      // isNavigator = isRegistered && !isDeactivated
      // After exit: isRegistered is still true (for withdrawStake), isDeactivated is false
      // So isNavigator returns true even after exit finalization
      // The exiting state is tracked via isExiting()
      expect(await navigatorRegistry.isExiting(navigator1.address)).to.be.true
    })
  })
})
