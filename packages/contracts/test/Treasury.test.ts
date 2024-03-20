import { ethers } from "hardhat"
import { expect } from "chai"
import { getOrDeployContractInstances, catchRevert, createProposalAndExecuteIt } from "./helpers"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { describe, it, before } from "mocha"
import { fundTreasuryVET, fundTreasuryVTHO } from "./helpers/fundTreasury"
import { Treasury } from "../typechain-types"
import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { deployProxy } from "../scripts/helpers"

describe("Treasury", () => {
  let treasuryProxy: any
  let b3tr: any
  let governor: any
  let vot3: any
  let timeLock: any
  let owner: HardhatEthersSigner
  let otherAccount: HardhatEthersSigner
  before(async () => {
    const config = createLocalConfig()
    config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
    config.B3TR_GOVERNOR_VOTING_PERIOD = 3
    config.B3TR_GOVERNOR_VOTING_DELAY = 1
    const info = await getOrDeployContractInstances({
      forceDeploy: true,
      config,
    })
    treasuryProxy = info.treasury
    owner = info.owner
    otherAccount = info.otherAccount
    b3tr = info.b3tr
    governor = info.governor
    vot3 = info.vot3
    timeLock = info.timeLock

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
  describe("Pause", () => {
    it("should pause and unpause", async () => {
      await treasuryProxy.pause()
      expect(await treasuryProxy.paused()).to.eql(true)
      await treasuryProxy.unpause()
      expect(await treasuryProxy.paused()).to.eql(false)
    })
    it("should revert if not called by ADMIN_ROLE", async () => {
      await catchRevert(treasuryProxy.connect(otherAccount).pause())
    })
  })
  describe("Timelock", () => {
    let tProxy: any
    let Treasury: any
    before(async () => {
      tProxy = (await deployProxy("Treasury", [
        await b3tr.getAddress(),
        await vot3.getAddress(),
        await timeLock.getAddress(),
        owner.address,
        owner.address,
      ])) as Treasury

      await fundTreasuryVET(await tProxy.getAddress(), 10)
    })
    it("should execute transfer TX from proposal", async () => {
      const description = "Test Proposal: testing propsal for Transfer VET from tresausry"

      await createProposalAndExecuteIt(owner, otherAccount, governor, tProxy, Treasury, description, "transferVET", [
        owner.address,
        ethers.parseEther("5"),
      ])

      expect(await tProxy.getVETBalance()).to.eql(ethers.parseEther("5"))
    })
  })
})
