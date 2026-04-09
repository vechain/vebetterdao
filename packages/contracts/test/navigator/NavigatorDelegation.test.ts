import { expect } from "chai"
import { ethers } from "hardhat"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { getOrDeployContractInstances } from "../helpers/deploy"
import { getVot3Tokens, bootstrapAndStartEmissions, moveBlocks, waitForNextBlock } from "../helpers/common"
import { B3TR, NavigatorRegistry, VOT3, XAllocationVoting } from "../../typechain-types"

describe("NavigatorRegistry Delegation - @shard19b", function () {
  let navigatorRegistry: NavigatorRegistry
  let b3tr: B3TR
  let vot3: VOT3
  let xAllocationVoting: XAllocationVoting
  let veBetterPassport: any
  let owner: HardhatEthersSigner
  let navigator1: HardhatEthersSigner
  let citizen1: HardhatEthersSigner
  let citizen2: HardhatEthersSigner
  let citizen3: HardhatEthersSigner
  let otherAccount: HardhatEthersSigner

  const NAVIGATOR_STAKE = ethers.parseEther("50000")

  async function registerNavigator(nav: HardhatEthersSigner, amount: bigint = NAVIGATOR_STAKE) {
    await b3tr.connect(owner).transfer(nav.address, amount)
    await b3tr.connect(nav).approve(await navigatorRegistry.getAddress(), amount)
    await navigatorRegistry.connect(nav).register(amount, "ipfs://navigator")
  }

  beforeEach(async function () {
    const contracts = await getOrDeployContractInstances({ forceDeploy: true })
    navigatorRegistry = contracts.navigatorRegistry
    b3tr = contracts.b3tr
    vot3 = contracts.vot3
    xAllocationVoting = contracts.xAllocationVoting
    veBetterPassport = contracts.veBetterPassport
    owner = contracts.owner
    navigator1 = contracts.otherAccounts[10]
    citizen1 = contracts.otherAccounts[11]
    citizen2 = contracts.otherAccounts[12]
    citizen3 = contracts.otherAccounts[13]
    otherAccount = contracts.otherAccounts[14]

    // Mint B3TR to owner for navigator registration transfers
    await b3tr.connect(contracts.minterAccount).mint(owner.address, ethers.parseEther("10000000"))

    // Ensure VOT3 supply exists (maxStake = vot3Supply * percentage / 10000)
    await getVot3Tokens(owner, "10000000")

    // Register a navigator
    await registerNavigator(navigator1)
  })

  // ======================== delegate() ======================== //

  describe("delegate()", function () {
    it("should delegate VOT3 to a navigator and update all state", async function () {
      await getVot3Tokens(citizen1, "1000")
      const amount = ethers.parseEther("500")

      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, amount)

      expect(await navigatorRegistry.getNavigator(citizen1.address)).to.equal(navigator1.address)
      expect(await navigatorRegistry.getDelegatedAmount(citizen1.address)).to.equal(amount)
      expect(await navigatorRegistry.getTotalDelegated(navigator1.address)).to.equal(amount)
      expect(await navigatorRegistry.isDelegated(citizen1.address)).to.equal(true)
    })

    it("should revert with ZeroDelegationAmount when amount is 0", async function () {
      await getVot3Tokens(citizen1, "1000")

      await expect(navigatorRegistry.connect(citizen1).delegate(navigator1.address, 0)).to.be.revertedWithCustomError(
        navigatorRegistry,
        "ZeroDelegationAmount",
      )
    })

    it("should revert with AlreadyDelegated when citizen delegates again (use increaseDelegation instead)", async function () {
      await getVot3Tokens(citizen1, "2000")
      const amount = ethers.parseEther("500")

      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, amount)

      // Second delegate() to same navigator should revert
      await expect(
        navigatorRegistry.connect(citizen1).delegate(navigator1.address, amount),
      ).to.be.revertedWithCustomError(navigatorRegistry, "AlreadyDelegated")
    })

    it("should revert with AlreadyDelegated when citizen delegates to a different navigator", async function () {
      await getVot3Tokens(citizen1, "2000")
      const amount = ethers.parseEther("500")

      const navigator2 = otherAccount
      await registerNavigator(navigator2)

      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, amount)

      await expect(
        navigatorRegistry.connect(citizen1).delegate(navigator2.address, amount),
      ).to.be.revertedWithCustomError(navigatorRegistry, "AlreadyDelegated")
    })

    it("should revert with NotANavigator when navigator is not registered", async function () {
      await getVot3Tokens(citizen1, "1000")

      await expect(
        navigatorRegistry.connect(citizen1).delegate(otherAccount.address, ethers.parseEther("500")),
      ).to.be.revertedWithCustomError(navigatorRegistry, "NotANavigator")
    })

    it("should revert when navigator is deactivated", async function () {
      await getVot3Tokens(citizen1, "1000")

      // Deactivate navigator via governance
      await navigatorRegistry.connect(owner).deactivateNavigator(navigator1.address, 0, false)

      await expect(
        navigatorRegistry.connect(citizen1).delegate(navigator1.address, ethers.parseEther("500")),
      ).to.be.revertedWithCustomError(navigatorRegistry, "NotANavigator")
    })

    it("should revert with NavigatorCannotAcceptDelegations when navigator is exiting", async function () {
      await getVot3Tokens(citizen1, "1000")

      // Bootstrap emissions so we have rounds
      await bootstrapAndStartEmissions()

      // Navigator announces exit
      await navigatorRegistry.connect(navigator1).announceExit()

      await expect(
        navigatorRegistry.connect(citizen1).delegate(navigator1.address, ethers.parseEther("500")),
      ).to.be.revertedWithCustomError(navigatorRegistry, "NavigatorCannotAcceptDelegations")
    })

    it("should revert with ExceedsNavigatorCapacity when delegation exceeds capacity", async function () {
      // Navigator staked 50K, capacity = 50K * 10 = 500K
      await getVot3Tokens(citizen1, "600000")

      await expect(
        navigatorRegistry.connect(citizen1).delegate(navigator1.address, ethers.parseEther("600000")),
      ).to.be.revertedWithCustomError(navigatorRegistry, "ExceedsNavigatorCapacity")
    })

    it("should allow multiple citizens to delegate", async function () {
      await getVot3Tokens(citizen1, "1000")
      await getVot3Tokens(citizen2, "1000")
      await getVot3Tokens(citizen3, "1000")

      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, ethers.parseEther("100"))
      await navigatorRegistry.connect(citizen2).delegate(navigator1.address, ethers.parseEther("200"))
      await navigatorRegistry.connect(citizen3).delegate(navigator1.address, ethers.parseEther("300"))

      expect(await navigatorRegistry.getTotalDelegated(navigator1.address)).to.equal(
        ethers.parseEther("100") + ethers.parseEther("200") + ethers.parseEther("300"),
      )
    })

    it("should emit DelegationCreated event", async function () {
      await getVot3Tokens(citizen1, "1000")
      const amount = ethers.parseEther("500")

      await expect(navigatorRegistry.connect(citizen1).delegate(navigator1.address, amount))
        .to.emit(navigatorRegistry, "DelegationCreated")
        .withArgs(citizen1.address, navigator1.address, amount)
    })

    it("should call disableAutoVotingFor when citizen delegates", async function () {
      await getVot3Tokens(citizen1, "1000")

      // Verify auto-voting is disabled (default) — delegate should not revert even without auto-voting
      expect(await xAllocationVoting.isUserAutoVotingEnabled(citizen1.address)).to.equal(false)

      // Delegate — disableAutoVotingFor is called but is a no-op since auto-voting wasn't enabled
      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, ethers.parseEther("500"))

      // Still disabled
      expect(await xAllocationVoting.isUserAutoVotingEnabled(citizen1.address)).to.equal(false)
    })
  })

  // ======================== increaseDelegation() ======================== //

  describe("increaseDelegation()", function () {
    it("should increase delegation and emit DelegationIncreased", async function () {
      await getVot3Tokens(citizen1, "2000")
      const initial = ethers.parseEther("500")
      const increase = ethers.parseEther("300")

      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, initial)

      await expect(navigatorRegistry.connect(citizen1).increaseDelegation(increase))
        .to.emit(navigatorRegistry, "DelegationIncreased")
        .withArgs(citizen1.address, navigator1.address, increase, initial + increase)

      expect(await navigatorRegistry.getDelegatedAmount(citizen1.address)).to.equal(initial + increase)
      expect(await navigatorRegistry.getTotalDelegated(navigator1.address)).to.equal(initial + increase)
    })

    it("should revert with NotDelegated when citizen is not delegated", async function () {
      await getVot3Tokens(citizen1, "1000")

      await expect(
        navigatorRegistry.connect(citizen1).increaseDelegation(ethers.parseEther("100")),
      ).to.be.revertedWithCustomError(navigatorRegistry, "NotDelegated")
    })

    it("should revert with ZeroDelegationAmount when amount is 0", async function () {
      await getVot3Tokens(citizen1, "1000")
      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, ethers.parseEther("500"))

      await expect(navigatorRegistry.connect(citizen1).increaseDelegation(0)).to.be.revertedWithCustomError(
        navigatorRegistry,
        "ZeroDelegationAmount",
      )
    })

    it("should revert with ExceedsNavigatorCapacity when increase exceeds capacity", async function () {
      await getVot3Tokens(citizen1, "600000")
      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, ethers.parseEther("100"))

      // Navigator staked 50K, capacity = 500K. Already 100 delegated. Trying to add 500K should fail.
      await expect(
        navigatorRegistry.connect(citizen1).increaseDelegation(ethers.parseEther("500000")),
      ).to.be.revertedWithCustomError(navigatorRegistry, "ExceedsNavigatorCapacity")
    })
  })

  // ======================== reduceDelegation() ======================== //

  describe("reduceDelegation()", function () {
    it("should partially reduce delegation and emit DelegationDecreased", async function () {
      await getVot3Tokens(citizen1, "1000")
      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, ethers.parseEther("500"))

      await expect(navigatorRegistry.connect(citizen1).reduceDelegation(ethers.parseEther("200")))
        .to.emit(navigatorRegistry, "DelegationDecreased")
        .withArgs(citizen1.address, navigator1.address, ethers.parseEther("200"), ethers.parseEther("300"))

      expect(await navigatorRegistry.getDelegatedAmount(citizen1.address)).to.equal(ethers.parseEther("300"))
    })

    it("should fully undelegate when reducing to zero and emit DelegationRemoved", async function () {
      await getVot3Tokens(citizen1, "1000")
      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, ethers.parseEther("500"))

      await expect(navigatorRegistry.connect(citizen1).reduceDelegation(ethers.parseEther("500")))
        .to.emit(navigatorRegistry, "DelegationRemoved")
        .withArgs(citizen1.address, navigator1.address)

      expect(await navigatorRegistry.getDelegatedAmount(citizen1.address)).to.equal(0)
      expect(await navigatorRegistry.getNavigator(citizen1.address)).to.equal(ethers.ZeroAddress)
      expect(await navigatorRegistry.isDelegated(citizen1.address)).to.equal(false)
    })

    it("should revert with InsufficientDelegation when reducing more than delegated", async function () {
      await getVot3Tokens(citizen1, "1000")
      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, ethers.parseEther("500"))

      await expect(
        navigatorRegistry.connect(citizen1).reduceDelegation(ethers.parseEther("501")),
      ).to.be.revertedWithCustomError(navigatorRegistry, "InsufficientDelegation")
    })

    it("should revert with ZeroDelegationAmount when amount is 0", async function () {
      await getVot3Tokens(citizen1, "1000")
      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, ethers.parseEther("500"))

      await expect(navigatorRegistry.connect(citizen1).reduceDelegation(0)).to.be.revertedWithCustomError(
        navigatorRegistry,
        "ZeroDelegationAmount",
      )
    })

    it("should revert with NotDelegated when citizen is not delegated", async function () {
      await expect(
        navigatorRegistry.connect(citizen1).reduceDelegation(ethers.parseEther("100")),
      ).to.be.revertedWithCustomError(navigatorRegistry, "NotDelegated")
    })
  })

  // ======================== undelegate() ======================== //

  describe("undelegate()", function () {
    it("should fully undelegate and clear all state", async function () {
      await getVot3Tokens(citizen1, "1000")
      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, ethers.parseEther("500"))

      await navigatorRegistry.connect(citizen1).undelegate()

      expect(await navigatorRegistry.getDelegatedAmount(citizen1.address)).to.equal(0)
      expect(await navigatorRegistry.getNavigator(citizen1.address)).to.equal(ethers.ZeroAddress)
      expect(await navigatorRegistry.isDelegated(citizen1.address)).to.equal(false)
    })

    it("should revert with NotDelegated when citizen is not delegated", async function () {
      await expect(navigatorRegistry.connect(citizen1).undelegate()).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NotDelegated",
      )
    })

    it("should correctly maintain citizen array after middle undelegate", async function () {
      await getVot3Tokens(citizen1, "1000")
      await getVot3Tokens(citizen2, "1000")
      await getVot3Tokens(citizen3, "1000")

      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, ethers.parseEther("100"))
      await navigatorRegistry.connect(citizen2).delegate(navigator1.address, ethers.parseEther("100"))
      await navigatorRegistry.connect(citizen3).delegate(navigator1.address, ethers.parseEther("100"))

      // Undelegate the middle citizen
      await navigatorRegistry.connect(citizen2).undelegate()

      expect(await navigatorRegistry.isDelegated(citizen1.address)).to.equal(true)
      expect(await navigatorRegistry.isDelegated(citizen2.address)).to.equal(false)
      expect(await navigatorRegistry.isDelegated(citizen3.address)).to.equal(true)
    })
  })

  // ======================== Checkpoints ======================== //

  describe("Checkpoints", function () {
    it("should return 0 for delegation amount before delegation block", async function () {
      await getVot3Tokens(citizen1, "1000")

      const blockBefore = await ethers.provider.getBlockNumber()

      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, ethers.parseEther("500"))
      await waitForNextBlock()

      expect(await navigatorRegistry.getDelegatedAmountAtTimepoint(citizen1.address, blockBefore)).to.equal(0)
    })

    it("should return delegated amount at delegation block", async function () {
      await getVot3Tokens(citizen1, "1000")
      const amount = ethers.parseEther("500")

      const tx = await navigatorRegistry.connect(citizen1).delegate(navigator1.address, amount)
      const receipt = await tx.wait()
      const delegationBlock = receipt!.blockNumber

      await moveBlocks(3)

      expect(await navigatorRegistry.getDelegatedAmountAtTimepoint(citizen1.address, delegationBlock)).to.equal(amount)
    })

    it("should preserve old amount at old block after reduce", async function () {
      await getVot3Tokens(citizen1, "1000")
      const initialAmount = ethers.parseEther("500")

      const tx = await navigatorRegistry.connect(citizen1).delegate(navigator1.address, initialAmount)
      const receipt = await tx.wait()
      const delegationBlock = receipt!.blockNumber

      await moveBlocks(3)

      // Reduce delegation
      await navigatorRegistry.connect(citizen1).reduceDelegation(ethers.parseEther("200"))

      await moveBlocks(2)

      // Old block should still show old amount
      expect(await navigatorRegistry.getDelegatedAmountAtTimepoint(citizen1.address, delegationBlock)).to.equal(
        initialAmount,
      )

      // Current amount should be reduced
      expect(await navigatorRegistry.getDelegatedAmount(citizen1.address)).to.equal(ethers.parseEther("300"))
    })
  })

  // ======================== VOT3 Lock ======================== //

  describe("VOT3 Lock", function () {
    it("should allow transfer of unlocked balance", async function () {
      await getVot3Tokens(citizen1, "1000")
      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, ethers.parseEther("500"))

      // Transfer 500 (unlocked portion) should succeed
      await expect(vot3.connect(citizen1).transfer(otherAccount.address, ethers.parseEther("500"))).to.not.be.reverted
    })

    it("should revert transfer that dips into locked balance", async function () {
      await getVot3Tokens(citizen1, "1000")
      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, ethers.parseEther("500"))

      // Transfer 501 should fail — would go below locked 500
      await expect(vot3.connect(citizen1).transfer(otherAccount.address, ethers.parseEther("501"))).to.be.revertedWith(
        "VOT3: transfer exceeds unlocked balance",
      )
    })

    it("should revert convertToB3TR that dips into locked balance", async function () {
      await getVot3Tokens(citizen1, "1000")
      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, ethers.parseEther("500"))

      // convertToB3TR(501) should fail
      await expect(vot3.connect(citizen1).convertToB3TR(ethers.parseEther("501"))).to.be.revertedWith(
        "VOT3: transfer exceeds unlocked balance",
      )
    })

    it("should allow full transfer after undelegate", async function () {
      await getVot3Tokens(citizen1, "1000")
      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, ethers.parseEther("500"))

      await navigatorRegistry.connect(citizen1).undelegate()

      // Full balance should be transferable now
      const balance = await vot3.balanceOf(citizen1.address)
      await expect(vot3.connect(citizen1).transfer(otherAccount.address, balance)).to.not.be.reverted
    })

    it("should return correct getNavigatorLockedAmount on VOT3", async function () {
      await getVot3Tokens(citizen1, "1000")
      const amount = ethers.parseEther("500")

      expect(await vot3.getNavigatorLockedAmount(citizen1.address)).to.equal(0)

      await navigatorRegistry.connect(citizen1).delegate(navigator1.address, amount)

      expect(await vot3.getNavigatorLockedAmount(citizen1.address)).to.equal(amount)

      await navigatorRegistry.connect(citizen1).undelegate()

      expect(await vot3.getNavigatorLockedAmount(citizen1.address)).to.equal(0)
    })
  })
})
