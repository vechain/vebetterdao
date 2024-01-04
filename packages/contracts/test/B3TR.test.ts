import { ethers } from "hardhat"
import { expect } from "chai"
import { getOrDeployContractInstances } from "./helpers"

describe("B3TR", function () {

  describe("Deployment", function () {
    it("should deploy the contract", async function () {
      const { b3tr } = await getOrDeployContractInstances()
      await b3tr.waitForDeployment()
      const address = await b3tr.getAddress()

      expect(address).not.to.eql(undefined)
    })

    it("should have the correct name", async function () {
      const { b3tr } = await getOrDeployContractInstances()

      const res = await b3tr.name()
      expect(res).to.eql("B3TR")

      const res2 = await b3tr.symbol()
      expect(res2).to.eql("B3TR")
    })

    it("should have the correct max supply", async function () {
      const { b3tr } = await getOrDeployContractInstances()

      const cap = await b3tr.cap()
      expect(String(cap)).to.eql("1000000000000000000000000000")
    })

    it("admin role is set correctly upon deploy", async function () {
      const { b3tr, owner } = await getOrDeployContractInstances()

      const defaultAdminRole = await b3tr.DEFAULT_ADMIN_ROLE()

      const res = await b3tr.hasRole(defaultAdminRole, owner)
      expect(res).to.eql(true)
    })

    it("minter role is set correctly upon deploy", async function () {
      const { b3tr, owner, otherAccount, minterAccount } = await getOrDeployContractInstances()
      const operatorRole = await b3tr.MINTER_ROLE()

      const res = await b3tr.hasRole(operatorRole, minterAccount)
      expect(res).to.eql(true)

      // test that operator role is not set for other accounts
      expect(await b3tr.hasRole(operatorRole, otherAccount)).to.eql(false)
    })
  })

  describe("Access Control", function () {
    it("only admin can grant minter role", async function () {
      const { b3tr, owner, otherAccount } = await getOrDeployContractInstances(true)

      const operatorRole = await b3tr.MINTER_ROLE()

      expect(await b3tr.hasRole(operatorRole, otherAccount)).to.eql(false)

      expect(b3tr.connect(otherAccount).grantRole(operatorRole, otherAccount)).to.be.revertedWithoutReason

      await b3tr.connect(owner).grantRole(operatorRole, otherAccount)
      expect(await b3tr.hasRole(operatorRole, otherAccount)).to.eql(true)
    })

    it("only admin can revoke minter role", async function () {
      const { b3tr, owner, otherAccount } = await getOrDeployContractInstances()

      const operatorRole = await b3tr.MINTER_ROLE()

      await b3tr.connect(owner).grantRole(operatorRole, otherAccount)
      expect(await b3tr.hasRole(operatorRole, otherAccount)).to.eql(true)

      expect(b3tr.connect(otherAccount).revokeRole(operatorRole, otherAccount)).to.be.revertedWithoutReason

      await b3tr.connect(owner).revokeRole(operatorRole, otherAccount)
      expect(await b3tr.hasRole(operatorRole, otherAccount)).to.eql(false)
    })

    it("only admin can grant admin role", async function () {
      const { b3tr, owner, otherAccount } = await getOrDeployContractInstances()

      const adminRole = await b3tr.DEFAULT_ADMIN_ROLE()

      // at the beginning owner is admin
      expect(await b3tr.hasRole(adminRole, otherAccount)).to.eql(false)
      expect(await b3tr.hasRole(adminRole, owner)).to.eql(true)

      expect(b3tr.connect(otherAccount).grantRole(adminRole, otherAccount)).to.be.revertedWithoutReason

      await b3tr.connect(owner).grantRole(adminRole, otherAccount)
      expect(await b3tr.hasRole(adminRole, otherAccount)).to.eql(true)

      // owner is still admin until it is revoked
      expect(await b3tr.hasRole(adminRole, owner)).to.eql(true)
    })

    it("only admin can revoke admin role", async function () {
      const { b3tr, owner, otherAccount, minterAccount } = await getOrDeployContractInstances()

      const adminRole = await b3tr.DEFAULT_ADMIN_ROLE()

      // after last test both owner and otherAccount are admin
      expect(await b3tr.hasRole(adminRole, otherAccount)).to.eql(true)
      expect(await b3tr.hasRole(adminRole, owner)).to.eql(true)

      expect(b3tr.connect(minterAccount).revokeRole(adminRole, owner)).to.be.revertedWithoutReason

      await b3tr.connect(otherAccount).revokeRole(adminRole, owner)

      // owner is no longer admin
      expect(await b3tr.hasRole(adminRole, owner)).to.eql(false)

      // otherAccount is still admin until
      expect(await b3tr.hasRole(adminRole, otherAccount)).to.eql(true)
    })
  })

  describe("Max supply", function () {
    it("cannot be minted more than max supply", async function () {
      const { b3tr, otherAccount, owner } = await getOrDeployContractInstances(true)
      const operatorRole = await b3tr.MINTER_ROLE()

      await b3tr.grantRole(operatorRole, owner)
      expect(b3tr.mint(otherAccount, ethers.parseEther("1000000001"))).to.be.revertedWithoutReason
    })

    it("can be minted up to max supply", async function () {
      const { b3tr, otherAccount, owner } = await getOrDeployContractInstances()
      const operatorRole = await b3tr.MINTER_ROLE()

      await b3tr.grantRole(operatorRole, owner)
      await expect(b3tr.mint(otherAccount, ethers.parseEther("1000000000"))).not.to.be.reverted

      const balance = await b3tr.balanceOf(otherAccount)
      expect(String(balance)).to.eql(ethers.parseEther("1000000000").toString())
    })
  })

  describe("Mint", function () {
    it("only accounts with minter role can mint", async function () {
      const { b3tr, otherAccount, owner } = await getOrDeployContractInstances(true)

      expect(b3tr.mint(otherAccount, ethers.parseEther("1"))).to.be.revertedWithoutReason
      const operatorRole = await b3tr.MINTER_ROLE()

      await b3tr.grantRole(operatorRole, owner)
      await expect(b3tr.mint(otherAccount, ethers.parseEther("1"))).not.to.be.reverted

      const balance = await b3tr.balanceOf(otherAccount)
      expect(String(balance)).to.eql(ethers.parseEther("1").toString())
    })
  })

  describe("Token details", function () {
    it("returns expected information", async function () {
      const { b3tr } = await getOrDeployContractInstances()

      const name = await b3tr.name()
      const symbol = await b3tr.symbol()
      const decimals = await b3tr.decimals()
      const cap = await b3tr.cap()
      const totalSupply = await b3tr.totalSupply()

      const tokenDetails = await b3tr.tokenDetails()

      expect(tokenDetails[0]).to.eql(name)
      expect(tokenDetails[1]).to.eql(symbol)
      expect(tokenDetails[2]).to.eql(decimals)
      expect(tokenDetails[3]).to.eql(totalSupply)
      expect(tokenDetails[4]).to.eql(cap)
    })
  })
})
