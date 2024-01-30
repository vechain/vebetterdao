import { assert, ethers } from "hardhat"
import { expect } from "chai"
import { catchRevert, getOrDeployContractInstances, getVot3Tokens } from "./helpers"
import { describe, it } from "mocha"

describe("VOT3", function () {
  describe("Deployment", function () {
    it("should deploy the contract", async function () {
      const { vot3 } = await getOrDeployContractInstances()
      await vot3.waitForDeployment()
      const address = await vot3.getAddress()

      expect(address).not.to.eql(undefined)
    })

    it("should have the correct name", async function () {
      const { vot3 } = await getOrDeployContractInstances()

      const res = await vot3.name()
      expect(res).to.eql("VOT3")

      const res2 = await vot3.symbol()
      expect(res2).to.eql("VOT3")
    })

    it("admin role is set correctly upon deploy", async function () {
      const { vot3, owner } = await getOrDeployContractInstances()

      const defaultAdminRole = await vot3.DEFAULT_ADMIN_ROLE()

      const res = await vot3.hasRole(defaultAdminRole, owner)
      expect(res).to.eql(true)
    })
  })

  describe("Lock B3TR", function () {
    it("should lock B3TR and mint VOT3", async function () {
      const { b3tr, vot3, minterAccount, otherAccount } = await getOrDeployContractInstances(true)

      // Mint some B3TR
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted

      // Approve VOT3 to spend B3TR on behalf of otherAccount. N.B. this is an important step and could be included in a multi clause transaction
      await expect(b3tr.connect(otherAccount).approve(await vot3.getAddress(), ethers.parseEther("9"))).not.to.be
        .reverted

      // Lock B3TR to get VOT3
      await expect(vot3.connect(otherAccount).stake(ethers.parseEther("9"))).not.to.be.reverted

      // Check balances
      expect(await b3tr.balanceOf(otherAccount)).to.eql(ethers.parseEther("991"))
      expect(await b3tr.balanceOf(await vot3.getAddress())).to.eql(ethers.parseEther("9"))
      expect(await vot3.balanceOf(otherAccount)).to.eql(ethers.parseEther("9"))
      expect(await vot3.stakedBalanceOf(otherAccount)).to.eql(ethers.parseEther("9"))
    })

    it("should not lock B3TR if not enough B3TR approved", async function () {
      const { b3tr, vot3, minterAccount, otherAccount } = await getOrDeployContractInstances(true)

      // Mint some B3TR
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted

      // Approve VOT3 to spend B3TR on behalf of otherAccount. N.B. this is an important step and could be included in a multi clause transaction
      await expect(b3tr.connect(otherAccount).approve(await vot3.getAddress(), ethers.parseEther("9"))).not.to.be
        .reverted

      // Lock B3TR to get VOT3
      await catchRevert(vot3.stake(ethers.parseEther("10")))
    })
  })

  describe("Unlock B3TR", function () {
    it("should burn VOT3 and unlock B3TR", async function () {
      const { b3tr, vot3, minterAccount, otherAccount } = await getOrDeployContractInstances(true)

      const vot3Address = await vot3.getAddress()

      // Mint some B3TR
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted

      // Approve VOT3 to spend B3TR on behalf of otherAccount. N.B. this is an important step and could be included in a multi clause transaction
      await expect(b3tr.connect(otherAccount).approve(vot3Address, ethers.parseEther("9"))).not.to.be.reverted

      // Lock B3TR to get VOT3
      await expect(vot3.connect(otherAccount).stake(ethers.parseEther("9"))).not.to.be.reverted

      // Check balances
      expect(await b3tr.balanceOf(otherAccount)).to.eql(ethers.parseEther("991"))
      expect(await vot3.balanceOf(otherAccount)).to.eql(ethers.parseEther("9"))
      expect(await vot3.stakedBalanceOf(otherAccount)).to.eql(ethers.parseEther("9"))
      expect(await b3tr.balanceOf(vot3Address)).to.eql(ethers.parseEther("9"))

      // Unlock B3TR to burn VOT3
      await expect(vot3.connect(otherAccount).unstake(ethers.parseEther("9"), { gasLimit: 10_000_000 })).not.to.be
        .reverted

      // Check balances
      expect(await b3tr.balanceOf(otherAccount)).to.eql(ethers.parseEther("1000"))
      expect(await b3tr.balanceOf(vot3Address)).to.eql(ethers.parseEther("0"))
      expect(await vot3.balanceOf(otherAccount)).to.eql(ethers.parseEther("0"))
      expect(await vot3.stakedBalanceOf(otherAccount)).to.eql(ethers.parseEther("0"))
    })

    it("should not unlock B3TR if not enough VOT3", async function () {
      const { b3tr, vot3, minterAccount, otherAccount } = await getOrDeployContractInstances(true)

      // Mint some B3TR
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted

      // Approve VOT3 to spend B3TR on behalf of otherAccount. N.B. this is an important step and could be included in a multi clause transaction
      await expect(b3tr.connect(otherAccount).approve(await vot3.getAddress(), ethers.parseEther("9"))).not.to.be
        .reverted

      // Lock B3TR to get VOT3
      await expect(vot3.connect(otherAccount).stake(ethers.parseEther("9"))).not.to.be.reverted

      // Check balances
      expect(await b3tr.balanceOf(otherAccount)).to.eql(ethers.parseEther("991"))
      expect(await b3tr.balanceOf(await vot3.getAddress())).to.eql(ethers.parseEther("9"))
      expect(await vot3.balanceOf(otherAccount)).to.eql(ethers.parseEther("9"))
      expect(await vot3.stakedBalanceOf(otherAccount)).to.eql(ethers.parseEther("9"))

      // Unlock B3TR to burn VOT3
      await catchRevert(vot3.connect(otherAccount).unstake(ethers.parseEther("10")))
    })

    it("should not unlock B3TR if not enough staked balance, even if there is enough VOT3 balance)", async function () {
      const { b3tr, vot3, owner, minterAccount, otherAccount, otherAccounts } = await getOrDeployContractInstances(true)

      // Mint some B3TR to two accounts
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted
      await expect(b3tr.connect(minterAccount).mint(otherAccounts[0], ethers.parseEther("1000"))).not.to.be.reverted

      // Approve VOT3 to spend B3TR on behalf of otherAccount. N.B. this is an important step and could be included in a multi clause transaction
      await expect(b3tr.connect(otherAccount).approve(await vot3.getAddress(), ethers.parseEther("7"))).not.to.be
        .reverted
      await expect(b3tr.connect(otherAccounts[0]).approve(await vot3.getAddress(), ethers.parseEther("8"))).not.to.be
        .reverted

      // Lock B3TR to get VOT3
      await expect(vot3.connect(otherAccount).stake(ethers.parseEther("7"))).not.to.be.reverted
      // Wait 10 seconds, TODO: can we fix this?
      await new Promise(resolve => setTimeout(resolve, 10000))
      await expect(vot3.connect(otherAccounts[0]).stake(ethers.parseEther("8"))).not.to.be.reverted

      // Check balances
      expect(await b3tr.balanceOf(await vot3.getAddress())).to.eql(ethers.parseEther("15"))

      expect(await b3tr.balanceOf(otherAccount)).to.eql(ethers.parseEther("993"))
      expect(await vot3.balanceOf(otherAccount)).to.eql(ethers.parseEther("7"))
      expect(await vot3.stakedBalanceOf(otherAccount)).to.eql(ethers.parseEther("7"))

      expect(await b3tr.balanceOf(otherAccounts[0])).to.eql(ethers.parseEther("992"))
      expect(await vot3.balanceOf(otherAccounts[0])).to.eql(ethers.parseEther("8"))
      expect(await vot3.stakedBalanceOf(otherAccounts[0])).to.eql(ethers.parseEther("8"))

      // Enable canTransfer
      await expect(vot3.connect(owner).setCanTransfer(true)).not.to.be.reverted

      // Transfer VOT3 from otherAccounts[0] to otherAccount
      await expect(vot3.connect(otherAccounts[0]).transfer(otherAccount, ethers.parseEther("2"))).not.to.be.reverted

      // Check balances
      expect(await vot3.balanceOf(otherAccount)).to.eql(ethers.parseEther("9"))
      expect(await vot3.stakedBalanceOf(otherAccount)).to.eql(ethers.parseEther("7"))

      expect(await vot3.balanceOf(otherAccounts[0])).to.eql(ethers.parseEther("6"))
      expect(await vot3.stakedBalanceOf(otherAccounts[0])).to.eql(ethers.parseEther("8"))

      // Attempt to unlock 8 VOT3 from otherAccount
      await catchRevert(vot3.connect(otherAccount).unstake(ethers.parseEther("8")))

      // Finally unlock 7 VOT3 from otherAccount
      await expect(vot3.connect(otherAccount).unstake(ethers.parseEther("7"))).not.to.be.reverted
    })
  })

  describe("VOT3 should not be transferable by default", function () {
    it("transfer", async function () {
      const { b3tr, vot3, owner, minterAccount, otherAccount } = await getOrDeployContractInstances(true)

      // Mint some B3TR
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted

      // Approve VOT3 to spend B3TR on behalf of otherAccount. N.B. this is an important step and could be included in a multi clause transaction
      await expect(b3tr.connect(otherAccount).approve(await vot3.getAddress(), ethers.parseEther("9"))).not.to.be
        .reverted

      // Lock B3TR to get VOT3
      await expect(vot3.connect(otherAccount).stake(ethers.parseEther("9"))).not.to.be.reverted

      await catchRevert(vot3.connect(otherAccount).transfer(owner, ethers.parseEther("1")))
    })

    it("transferFrom", async function () {
      const { b3tr, vot3, owner, minterAccount, otherAccount } = await getOrDeployContractInstances(true)

      // Mint some B3TR
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted

      // Approve VOT3 to spend B3TR on behalf of otherAccount. N.B. this is an important step and could be included in a multi clause transaction
      await expect(b3tr.connect(otherAccount).approve(await vot3.getAddress(), ethers.parseEther("9"))).not.to.be
        .reverted

      // Lock B3TR to get VOT3
      await expect(vot3.connect(otherAccount).stake(ethers.parseEther("9"))).not.to.be.reverted

      try {
        // Approve myself to spend VOT3
        await expect(vot3.connect(otherAccount).approve(otherAccount, ethers.parseEther("9"))).not.to.be.reverted

        // N.B. It will actually fail on the previous line
        // Transfer VOT3
        await vot3.connect(otherAccount).transferFrom(otherAccount, owner, ethers.parseEther("1"))
        assert.fail("The transaction should have failed")
      } catch (err: any) { }
    })

    it("approve", async function () {
      const { b3tr, vot3, owner, minterAccount, otherAccount } = await getOrDeployContractInstances(true)

      // Mint some B3TR
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted

      // Approve VOT3 to spend B3TR on behalf of otherAccount. N.B. this is an important step and could be included in a multi clause transaction
      await expect(b3tr.connect(otherAccount).approve(await vot3.getAddress(), ethers.parseEther("9"))).not.to.be
        .reverted

      // Lock B3TR to get VOT3
      await expect(vot3.connect(otherAccount).stake(ethers.parseEther("9"))).not.to.be.reverted

      await catchRevert(vot3.connect(otherAccount).approve(owner, ethers.parseEther("1")))
    })
  })

  describe("VOT3 should be transferable after canTransfer is enabled", function () {
    it("transfer", async function () {
      const { b3tr, vot3, owner, minterAccount, otherAccount } = await getOrDeployContractInstances(true)

      // Mint some B3TR
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted

      // Approve VOT3 to spend B3TR on behalf of otherAccount. N.B. this is an important step and could be included in a multi clause transaction
      await expect(b3tr.connect(otherAccount).approve(await vot3.getAddress(), ethers.parseEther("9"))).not.to.be
        .reverted

      // Lock B3TR to get VOT3
      await expect(vot3.connect(otherAccount).stake(ethers.parseEther("9"))).not.to.be.reverted

      // Enable canTransfer
      await expect(vot3.connect(owner).setCanTransfer(true)).not.to.be.reverted

      // Transfer VOT3
      await expect(vot3.connect(otherAccount).transfer(owner, ethers.parseEther("1"))).not.to.be.reverted

      // Check balances
      expect(await vot3.balanceOf(otherAccount)).to.eql(ethers.parseEther("8"))
      expect(await vot3.balanceOf(owner)).to.eql(ethers.parseEther("1"))
    })

    it("transferFrom", async function () {
      const { b3tr, vot3, owner, minterAccount, otherAccount } = await getOrDeployContractInstances(true)

      // Mint some B3TR
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted

      // Approve VOT3 to spend B3TR on behalf of otherAccount. N.B. this is an important step and could be included in a multi clause transaction
      await expect(b3tr.connect(otherAccount).approve(await vot3.getAddress(), ethers.parseEther("9"))).not.to.be
        .reverted

      // Lock B3TR to get VOT3
      await expect(vot3.connect(otherAccount).stake(ethers.parseEther("9"))).not.to.be.reverted

      // Enable canTransfer
      await expect(vot3.connect(owner).setCanTransfer(true)).not.to.be.reverted

      // Approve myself to spend VOT3
      await expect(vot3.connect(otherAccount).approve(otherAccount, ethers.parseEther("9"))).not.to.be.reverted

      // Transfer VOT3
      await expect(vot3.connect(otherAccount).transferFrom(otherAccount, owner, ethers.parseEther("1"))).not.to.be
        .reverted

      // Check balances
      expect(await vot3.balanceOf(otherAccount)).to.eql(ethers.parseEther("8"))
      expect(await vot3.balanceOf(owner)).to.eql(ethers.parseEther("1"))
    })

    it("approve", async function () {
      const { b3tr, vot3, owner, minterAccount, otherAccount } = await getOrDeployContractInstances(true)

      // Mint some B3TR
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted

      // Approve VOT3 to spend B3TR on behalf of otherAccount. N.B. this is an important step and could be included in a multi clause transaction
      await expect(b3tr.connect(otherAccount).approve(await vot3.getAddress(), ethers.parseEther("9"))).not.to.be
        .reverted

      // Lock B3TR to get VOT3
      await expect(vot3.connect(otherAccount).stake(ethers.parseEther("9"))).not.to.be.reverted

      // Enable canTransfer
      await expect(vot3.connect(owner).setCanTransfer(true)).not.to.be.reverted

      // Transfer VOT3
      await expect(vot3.connect(otherAccount).approve(owner, ethers.parseEther("1"))).not.to.be.reverted
    })
  })

  describe("Toggle transferability", function () {
    it("Only admin can change canTransfer (true)", async function () {
      const { b3tr, vot3, owner, minterAccount, otherAccount } = await getOrDeployContractInstances(true)

      // Mint some B3TR
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted

      await catchRevert(vot3.connect(otherAccount).setCanTransfer(true))

      // Check flag
      expect(await vot3.canTransfer()).to.eql(false)

      await expect(vot3.connect(owner).setCanTransfer(true)).not.to.be.reverted

      // Check flag
      expect(await vot3.canTransfer()).to.eql(true)
    })

    it("Only admin can change canTransfer (false)", async function () {
      const { b3tr, vot3, owner, minterAccount, otherAccount } = await getOrDeployContractInstances(true)

      // Mint some B3TR
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted

      await catchRevert(vot3.connect(otherAccount).setCanTransfer(true))

      // Check flag
      expect(await vot3.canTransfer()).to.eql(false)

      await expect(vot3.connect(owner).setCanTransfer(false)).not.to.be.reverted

      // Check flag
      expect(await vot3.canTransfer()).to.eql(false)
    })

    it("Only admin can change canTransfer (multiple)", async function () {
      const { b3tr, vot3, owner, minterAccount, otherAccount } = await getOrDeployContractInstances(true)

      // Mint some B3TR
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted

      await catchRevert(vot3.connect(otherAccount).setCanTransfer(true))

      // Check flag
      expect(await vot3.canTransfer()).to.eql(false)

      await expect(vot3.connect(owner).setCanTransfer(true)).not.to.be.reverted

      // Check flag
      expect(await vot3.canTransfer()).to.eql(true)

      await expect(vot3.connect(owner).setCanTransfer(false)).not.to.be.reverted

      // Check flag
      expect(await vot3.canTransfer()).to.eql(false)
    })

    it("Non admin can't change canTransfer", async function () {
      const { vot3, otherAccount } = await getOrDeployContractInstances(true)

      await catchRevert(vot3.connect(otherAccount).setCanTransfer(true))

      // Check flag
      expect(await vot3.canTransfer()).to.eql(false)
    })
  })

  describe("Delegation", function () {
    it("User that never owned VOT3 should have 0 voting rights and no delegation set", async function () {
      const { vot3, otherAccount } = await getOrDeployContractInstances(true)

      expect(await vot3.balanceOf(otherAccount)).to.eql(ethers.parseEther("0"))
      expect(await vot3.getVotes(otherAccount)).to.eql(ethers.parseEther("0"))
      expect(await vot3.delegates(otherAccount)).to.eql("0x0000000000000000000000000000000000000000")
    })

    it("Self-delegation should be automatic upon swapping B3TR for VOT3", async function () {
      const { vot3, otherAccount } = await getOrDeployContractInstances(true)

      // Mint some B3TR and swap for VOT3
      await getVot3Tokens(otherAccount, "1000")

      expect(await vot3.balanceOf(otherAccount)).to.eql(ethers.parseEther("1000"))
      expect(await vot3.getVotes(otherAccount)).to.eql(ethers.parseEther("1000"))
      expect(await vot3.delegates(otherAccount)).to.eql(otherAccount.address)
    })

    it("Self-delegation should be automatic upon receiving VOT3 from another user", async function () {
      const { vot3, owner, minterAccount, otherAccount } = await getOrDeployContractInstances(true)

      // Mint some B3TR and swap for VOT3
      await getVot3Tokens(minterAccount, "1000")

      // user has no VOT3 and no delegation
      expect(await vot3.balanceOf(otherAccount)).to.eql(ethers.parseEther("0"))
      expect(await vot3.getVotes(otherAccount)).to.eql(ethers.parseEther("0"))
      expect(await vot3.delegates(otherAccount)).to.eql("0x0000000000000000000000000000000000000000")

      // enable transferability
      await vot3.connect(owner).setCanTransfer(true)

      // transfer
      await vot3.connect(minterAccount).transfer(otherAccount, ethers.parseEther("1"))

      // check that delegation was automatic
      expect(await vot3.balanceOf(otherAccount)).to.eql(ethers.parseEther("1"))
      expect(await vot3.getVotes(otherAccount)).to.eql(ethers.parseEther("1"))
      expect(await vot3.delegates(otherAccount)).to.eql(otherAccount.address)
    })

    it("Vote power is being tracked correclty", async function () {
      const { vot3, owner, minterAccount, otherAccount } = await getOrDeployContractInstances(true)
      // enable transferability
      await vot3.connect(owner).setCanTransfer(true)

      // Mint some B3TR and swap for VOT3
      await getVot3Tokens(otherAccount, "1000")

      // Initial state: 1000 VOT3, 1000 voting power, self-delegated
      expect(await vot3.balanceOf(otherAccount)).to.eql(ethers.parseEther("1000"))
      expect(await vot3.getVotes(otherAccount)).to.eql(ethers.parseEther("1000"))
      expect(await vot3.delegates(otherAccount)).to.eql(otherAccount.address)

      // transfer
      let tx = await vot3
        .connect(otherAccount)
        .transfer(minterAccount, ethers.parseEther("1"), { gasLimit: 10_000_000 })
      const receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      expect(await vot3.balanceOf(otherAccount)).to.eql(ethers.parseEther("999"))
      expect(await vot3.getVotes(otherAccount)).to.eql(ethers.parseEther("999"))
      expect(await vot3.delegates(otherAccount)).to.eql(otherAccount.address)

      expect(await vot3.getPastVotes(otherAccount, receipt.blockNumber - 1)).to.eql(ethers.parseEther("1000"))

      // transfer back
      await vot3.connect(minterAccount).transfer(otherAccount, ethers.parseEther("1"), { gasLimit: 10_000_000 })

      expect(await vot3.balanceOf(otherAccount)).to.eql(ethers.parseEther("1000"))
      expect(await vot3.getVotes(otherAccount)).to.eql(ethers.parseEther("1000"))
      expect(await vot3.delegates(otherAccount)).to.eql(otherAccount.address)

      // unstake
      await vot3.connect(otherAccount).unstake(ethers.parseEther("1000"), { gasLimit: 10_000_000 })

      expect(await vot3.balanceOf(otherAccount)).to.eql(ethers.parseEther("0"))
      expect(await vot3.getVotes(otherAccount)).to.eql(ethers.parseEther("0"))
      expect(await vot3.delegates(otherAccount)).to.eql(otherAccount.address)

      // we should not count voting power for the VOT3 contract itself
      expect(await vot3.delegates(await vot3.getAddress())).to.eql("0x0000000000000000000000000000000000000000")
    })

    it("Automatic self-delegation should be triggered only once", async function () {
      const { vot3, b3tr, owner, minterAccount, otherAccount } = await getOrDeployContractInstances(true)
      // enable transferability
      await vot3.connect(owner).setCanTransfer(true)

      // Mint some B3TR
      await b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))

      // Approve VOT3 to spend B3TR on behalf of otherAccount. N.B. this is an important step and could be included in a multi clause transaction
      await b3tr.connect(otherAccount).approve(await vot3.getAddress(), ethers.parseEther("1000"))

      // Lock B3TR to get VOT3
      const tx = await vot3.connect(otherAccount).stake(ethers.parseEther("1000"))
      let proposeReceipt = await tx.wait()

      let events = proposeReceipt?.logs
      if (!events) throw new Error("No events")

      // DelegateChanged event should be emitted
      let delegateChangedEvents = events.filter(
        (event: any) => event.fragment && event.fragment.name === "DelegateChanged",
      )
      expect(delegateChangedEvents).not.to.eql([])

      // Now if I do it again, it should not emit the event because it's already delegated to itself
      await b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))
      await b3tr.connect(otherAccount).approve(await vot3.getAddress(), ethers.parseEther("1000"))
      const secondTx = await vot3.connect(otherAccount).stake(ethers.parseEther("1000"))
      proposeReceipt = await secondTx.wait()

      events = proposeReceipt?.logs
      if (!events) throw new Error("No events")

      // DelegateChanged event should be emitted
      delegateChangedEvents = events.filter((event: any) => event.fragment && event.fragment.name === "DelegateChanged")
      expect(delegateChangedEvents).to.eql([])
    })

    it("Delegation to another user should still be possible", async function () {
      const { vot3, owner, minterAccount, otherAccount } = await getOrDeployContractInstances(true)
      // enable transferability
      await vot3.connect(owner).setCanTransfer(true)

      // Mint some B3TR and swap for VOT3
      await getVot3Tokens(otherAccount, "1000")

      // delegate to another user
      await vot3.connect(otherAccount).delegate(minterAccount.address, { gasLimit: 10_000_000 })

      expect(await vot3.balanceOf(otherAccount)).to.eql(ethers.parseEther("1000"))
      expect(await vot3.getVotes(otherAccount)).to.eql(ethers.parseEther("0"))
      expect(await vot3.delegates(otherAccount)).to.eql(minterAccount.address)

      expect(await vot3.balanceOf(minterAccount)).to.eql(ethers.parseEther("0"))
      expect(await vot3.getVotes(minterAccount)).to.eql(ethers.parseEther("1000"))
    })
  })
})
