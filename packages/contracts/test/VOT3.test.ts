import { assert, ethers } from "hardhat"
import { expect } from "chai"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"

interface DeployInstance {
  b3tr: any
  vot3: any
  owner: HardhatEthersSigner
  otherAccount: HardhatEthersSigner
  minterAccount: HardhatEthersSigner
}

describe("VOT3", function () {
  let cachedDeployInstance: DeployInstance
  async function deploy(forceDeploy = false): Promise<DeployInstance> {
    if (!forceDeploy && cachedDeployInstance !== undefined) {
      return cachedDeployInstance
    }

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, minterAccount] = await ethers.getSigners()

    // Deploy B3TR
    const B3trContract = await ethers.getContractFactory("B3TR")
    const b3tr = await B3trContract.deploy(minterAccount)

    // Deploy VOT3
    const Vot3Contract = await ethers.getContractFactory("VOT3")
    const vot3 = await Vot3Contract.deploy(await b3tr.getAddress())

    return { b3tr, vot3, owner, otherAccount, minterAccount }
  }

  describe("Deployment", function () {
    it("should deploy the contract", async function () {
      const { vot3 } = await deploy()
      await vot3.waitForDeployment()
      const address = await vot3.getAddress()

      expect(address).not.to.eql(undefined)
    })

    it("should have the correct name", async function () {
      const { vot3 } = await deploy()

      const res = await vot3.name()
      expect(res).to.eql("VOT3")

      const res2 = await vot3.symbol()
      expect(res2).to.eql("VOT3")
    })

    it("admin role is set correctly upon deploy", async function () {
      const { vot3, owner } = await deploy()

      const defaultAdminRole = await vot3.DEFAULT_ADMIN_ROLE()

      const res = await vot3.hasRole(defaultAdminRole, owner)
      expect(res).to.eql(true)
    })
  })

  describe("Lock B3TR", function () {
    it("should lock B3TR and mint VOT3", async function () {
      const { b3tr, vot3, minterAccount, otherAccount } = await deploy(true)

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
    })

    it("should not lock B3TR if not enough B3TR approved", async function () {
      const { b3tr, vot3, minterAccount, otherAccount } = await deploy(true)

      // Mint some B3TR
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted

      // Approve VOT3 to spend B3TR on behalf of otherAccount. N.B. this is an important step and could be included in a multi clause transaction
      await expect(b3tr.connect(otherAccount).approve(await vot3.getAddress(), ethers.parseEther("9"))).not.to.be
        .reverted

      // Lock B3TR to get VOT3
      try {
        await vot3.stake(ethers.parseEther("10"))
        assert.fail("The transaction should have failed")
      } catch (err: any) {
        assert(err.message.includes("execution reverted"), "Expected an 'execution reverted' error")
      }
    })
  })

  describe("Unlock B3TR", function () {
    it("should burn VOT3 and unlock B3TR", async function () {
      const { b3tr, vot3, minterAccount, otherAccount } = await deploy(true)

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
      expect(await b3tr.balanceOf(vot3Address)).to.eql(ethers.parseEther("9"))

      // Unlock B3TR to burn VOT3
      await expect(vot3.connect(otherAccount).unstake(ethers.parseEther("9"))).not.to.be.reverted

      // Check balances
      expect(await b3tr.balanceOf(otherAccount)).to.eql(ethers.parseEther("1000"))
      expect(await b3tr.balanceOf(vot3Address)).to.eql(ethers.parseEther("0"))
      expect(await vot3.balanceOf(otherAccount)).to.eql(ethers.parseEther("0"))
    })

    it("should not unlock B3TR if not enough VOT3", async function () {
      const { b3tr, vot3, minterAccount, otherAccount } = await deploy(true)

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

      // Unlock B3TR to burn VOT3
      try {
        await vot3.connect(otherAccount).unstake(ethers.parseEther("10"))
        assert.fail("The transaction should have failed")
      } catch (err: any) {
        assert(err.message.includes("execution reverted"), "Expected an 'execution reverted' error")
      }
    })
  })

  describe("VOT3 should not be transferable by default", function () {
    it("transfer", async function () {
      const { b3tr, vot3, owner, minterAccount, otherAccount } = await deploy(true)

      // Mint some B3TR
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted

      // Approve VOT3 to spend B3TR on behalf of otherAccount. N.B. this is an important step and could be included in a multi clause transaction
      await expect(b3tr.connect(otherAccount).approve(await vot3.getAddress(), ethers.parseEther("9"))).not.to.be
        .reverted

      // Lock B3TR to get VOT3
      await expect(vot3.connect(otherAccount).stake(ethers.parseEther("9"))).not.to.be.reverted

      try {
        await vot3.connect(otherAccount).transfer(owner, ethers.parseEther("1"))
        assert.fail("The transaction should have failed")
      } catch (err: any) {
        assert(err.message.includes("execution reverted"), "Expected an 'execution reverted' error")
      }
    })

    it("transferFrom", async function () {
      const { b3tr, vot3, owner, minterAccount, otherAccount } = await deploy(true)

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
      } catch (err: any) {}
    })

    it("approve", async function () {
      const { b3tr, vot3, owner, minterAccount, otherAccount } = await deploy(true)

      // Mint some B3TR
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted

      // Approve VOT3 to spend B3TR on behalf of otherAccount. N.B. this is an important step and could be included in a multi clause transaction
      await expect(b3tr.connect(otherAccount).approve(await vot3.getAddress(), ethers.parseEther("9"))).not.to.be
        .reverted

      // Lock B3TR to get VOT3
      await expect(vot3.connect(otherAccount).stake(ethers.parseEther("9"))).not.to.be.reverted

      try {
        await vot3.connect(otherAccount).approve(owner, ethers.parseEther("1"))
        assert.fail("The transaction should have failed")
      } catch (err: any) {
        assert(err.message.includes("execution reverted"), "Expected an 'execution reverted' error")
      }
    })
  })

  describe("VOT3 should be transferable after canTransfer is enabled", function () {
    it("transfer", async function () {
      const { b3tr, vot3, owner, minterAccount, otherAccount } = await deploy(true)

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
      const { b3tr, vot3, owner, minterAccount, otherAccount } = await deploy(true)

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
      const { b3tr, vot3, owner, minterAccount, otherAccount } = await deploy(true)

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
      const { b3tr, vot3, owner, minterAccount, otherAccount } = await deploy(true)

      // Mint some B3TR
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted

      try {
        await vot3.connect(otherAccount).setCanTransfer(true)
        assert.fail("The transaction should have failed")
      } catch (err: any) {
        assert(err.message.includes("execution reverted"), "Expected an 'execution reverted' error")
      }

      // Check flag
      expect(await vot3.canTransfer()).to.eql(false)

      await expect(vot3.connect(owner).setCanTransfer(true)).not.to.be.reverted

      // Check flag
      expect(await vot3.canTransfer()).to.eql(true)
    })

    it("Only admin can change canTransfer (false)", async function () {
      const { b3tr, vot3, owner, minterAccount, otherAccount } = await deploy(true)

      // Mint some B3TR
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted

      try {
        await vot3.connect(otherAccount).setCanTransfer(true)
        assert.fail("The transaction should have failed")
      } catch (err: any) {
        assert(err.message.includes("execution reverted"), "Expected an 'execution reverted' error")
      }

      // Check flag
      expect(await vot3.canTransfer()).to.eql(false)

      await expect(vot3.connect(owner).setCanTransfer(false)).not.to.be.reverted

      // Check flag
      expect(await vot3.canTransfer()).to.eql(false)
    })

    it("Only admin can change canTransfer (multiple)", async function () {
      const { b3tr, vot3, owner, minterAccount, otherAccount } = await deploy(true)

      // Mint some B3TR
      await expect(b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))).not.to.be.reverted

      try {
        await vot3.connect(otherAccount).setCanTransfer(true)
        assert.fail("The transaction should have failed")
      } catch (err: any) {
        assert(err.message.includes("execution reverted"), "Expected an 'execution reverted' error")
      }

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
      const { b3tr, vot3, owner, minterAccount, otherAccount } = await deploy(true)

      try {
        await vot3.connect(otherAccount).setCanTransfer(true)
        assert.fail("The transaction should have failed")
      } catch (err: any) {
        assert(err.message.includes("execution reverted"), "Expected an 'execution reverted' error")
      }

      // Check flag
      expect(await vot3.canTransfer()).to.eql(false)
    })
  })
})
