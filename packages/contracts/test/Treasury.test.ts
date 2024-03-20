import { ethers } from "hardhat"
import { expect } from "chai"
import { getOrDeployContractInstances, catchRevert } from "./helpers"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { describe, it, before } from "mocha"
import { fundTreasuryVET, fundTreasuryVTHO } from "./helpers/fundTreasury"

describe("Treasury", () => {
  let treasuryProxy: any
  let b3tr: any
  let owner: HardhatEthersSigner
  let otherAccount: HardhatEthersSigner
  before(async () => {
    const info = await getOrDeployContractInstances({
      forceDeploy: true,
    })
    treasuryProxy = info.treasuryProxy
    owner = info.owner
    otherAccount = info.otherAccount
    b3tr = info.b3tr

    await fundTreasuryVTHO(await treasuryProxy.getAddress(), ethers.parseEther("10"))
    await fundTreasuryVET(await treasuryProxy.getAddress(), 10)

    const operatorRole = await b3tr.MINTER_ROLE()
    await b3tr.grantRole(operatorRole, owner)
    await b3tr.mint(await treasuryProxy.getAddress(), ethers.parseEther("10"))
  })
  describe("Tokens", () => {
    describe("VTHO", () => {
      it("should transfer VTHO", async () => {
        expect(treasuryProxy.transferVTHO(otherAccount.address, ethers.parseEther("1"))).not.to.be.reverted
      })
      it("should revert if not enough balance", async () => {
        await catchRevert(treasuryProxy.transferVTHO(otherAccount.address, ethers.parseEther("11")))
      })
      it("should revert if not called by TIMELOCK_ROLE", async () => {
        await catchRevert(
          treasuryProxy.connect(otherAccount).transferVTHO(otherAccount.address, ethers.parseEther("1")),
        )
      })
    })
    describe("VET", () => {
      it("should transfer VET", async () => {
        expect(await treasuryProxy.getVETBalance()).to.eql(ethers.parseEther("10"))
        await treasuryProxy.transferVET(otherAccount.address, ethers.parseEther("1"))
        expect(await treasuryProxy.getVETBalance()).to.eql(ethers.parseEther("9"))
      })
      it("should revert if not enough balance", async () => {
        await catchRevert(treasuryProxy.transferVET(otherAccount.address, ethers.parseEther("11")))
      })
      it("should revert if not called by TIMELOCK_ROLE", async () => {
        await catchRevert(treasuryProxy.connect(otherAccount).transferVET(otherAccount.address, ethers.parseEther("1")))
      })
    })
    describe("B3TR", () => {
      it("should transfer B3TR", async () => {
        expect(await treasuryProxy.getB3TRBalance()).to.eql(ethers.parseEther("10"))
        await treasuryProxy.transferB3TR(otherAccount.address, ethers.parseEther("1"))
        expect(await treasuryProxy.getB3TRBalance()).to.eql(ethers.parseEther("9"))
      })
      it("should stake B3TR and recieve VOT3", async () => {
        await treasuryProxy.stakeB3TR(ethers.parseEther("5"))
        expect(await treasuryProxy.getB3TRBalance()).to.eql(ethers.parseEther("4"))
        expect(await treasuryProxy.getVOT3Balance()).to.eql(ethers.parseEther("5"))
      })
      it("should revert if not enough balance", async () => {
        await catchRevert(treasuryProxy.transferB3TR(otherAccount.address, ethers.parseEther("11")))
      })
      it("should revert if not called by TIMELOCK_ROLE", async () => {
        await catchRevert(
          treasuryProxy.connect(otherAccount).transferB3TR(otherAccount.address, ethers.parseEther("1")),
        )
      })
    })
    describe("VOT3", () => {
      it("should transfer VOT3", async () => {
        expect(await treasuryProxy.getVOT3Balance()).to.eql(ethers.parseEther("5"))
        await treasuryProxy.transferVOT3(otherAccount.address, ethers.parseEther("1"))
        expect(await treasuryProxy.getVOT3Balance()).to.eql(ethers.parseEther("4"))
      })
      it("should unstake B3TR and recieve B3TR", async () => {
        await treasuryProxy.unstakeB3TR(ethers.parseEther("4"))
        expect(await treasuryProxy.getB3TRBalance()).to.eql(ethers.parseEther("8"))
        expect(await treasuryProxy.getVOT3Balance()).to.eql(ethers.parseEther("0"))
      })
      it("should revert if not enough staked to unstake", async () => {
        await catchRevert(treasuryProxy.unstakeB3TR(ethers.parseEther("11")))
      })
      it("should revert if not called by TIMELOCK_ROLE", async () => {
        await catchRevert(
          treasuryProxy.connect(otherAccount).transferVOT3(otherAccount.address, ethers.parseEther("1")),
        )
      })
    })
  })
  describe("UUPS", () => {
    it("should upgrade", async () => {
      const newTreasury = await ethers.getContractFactory("Treasury")
      const newImplementation = await newTreasury.deploy()
      const emptyBytes = new Uint8Array(0)
      await treasuryProxy.upgradeToAndCall(await newImplementation.getAddress(), emptyBytes)
      const treasury = await ethers.getContractAt("Treasury", await treasuryProxy.getAddress())
      expect(await treasury.getB3TRBalance()).to.eql(ethers.parseEther("8"))
    })
    it("should revert if not called by ADMIN_ROLE", async () => {
      const newTreasury = await ethers.getContractFactory("Treasury")
      const newImplementation = await newTreasury.deploy()
      const emptyBytes = new Uint8Array(0)
      await catchRevert(
        treasuryProxy.connect(otherAccount).upgradeToAndCall(await newImplementation.getAddress(), emptyBytes),
      )
    })
  })
})
