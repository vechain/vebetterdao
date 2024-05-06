import { ethers, network } from "hardhat"
import { expect } from "chai"
import {
  getOrDeployContractInstances,
  catchRevert,
  createProposalAndExecuteIt,
  bootstrapAndStartEmissions,
  bootstrapEmissions,
  participateInAllocationVoting,
} from "./helpers"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { describe, it, before } from "mocha"
import { fundTreasuryVET, fundTreasuryVTHO } from "./helpers/fundTreasury"
import { B3TRGovernor, Treasury } from "../typechain-types"
import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { deployProxy } from "../scripts/helpers"

describe("Treasury", () => {
  let treasuryProxy: Treasury
  let b3tr: any
  let vot3: any
  let galaxyMember: any
  let owner: HardhatEthersSigner
  let otherAccount: HardhatEthersSigner
  before(async () => {
    const config = createLocalConfig()
    config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
    const info = await getOrDeployContractInstances({
      forceDeploy: true,
      config,
    })
    treasuryProxy = info.treasury
    owner = info.owner
    otherAccount = info.otherAccount
    b3tr = info.b3tr
    vot3 = info.vot3
    galaxyMember = info.galaxyMember

    await fundTreasuryVTHO(await treasuryProxy.getAddress(), ethers.parseEther("10"))
    await fundTreasuryVET(await treasuryProxy.getAddress(), 10)

    const operatorRole = await b3tr.MINTER_ROLE()
    await b3tr.grantRole(operatorRole, owner)
    await b3tr.mint(await treasuryProxy.getAddress(), ethers.parseEther("10"))
  })
  describe("Tokens", () => {
    describe("VTHO", () => {
      it("should transfer VTHO", async () => {
        if (network.name == "hardhat") {
          return console.log(
            "Skipping VTHO transfer test on hardhat network as hardcoded VTHO contract address in Treasury does not exist",
          )
        }
        const balance = await treasuryProxy.getVTHOBalance()
        await expect(treasuryProxy.transferVTHO(otherAccount.address, ethers.parseEther("1"))).not.to.be.reverted
        expect(await treasuryProxy.getVTHOBalance()).to.be.lessThan(balance)
      })
      it("should revert if not called by GOVERNANCE_ROLE", async () => {
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
      it("should revert if not called by GOVERNANCE_ROLE", async () => {
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
      it("should revert if not called by GOVERNANCE_ROLE", async () => {
        await catchRevert(
          treasuryProxy.connect(otherAccount).transferB3TR(otherAccount.address, ethers.parseEther("1")),
        )
      })
      it("should return correct address for contract", async () => {
        expect(await treasuryProxy.b3trAddress()).to.eql(await b3tr.getAddress())
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
      it("should revert if not called by GOVERNANCE_ROLE", async () => {
        await catchRevert(
          treasuryProxy.connect(otherAccount).transferVOT3(otherAccount.address, ethers.parseEther("1")),
        )
      })
      it("should return correct address for contract", async () => {
        expect(await treasuryProxy.vot3Address()).to.eql(await vot3.getAddress())
      })
    })
    describe("ERC20", () => {
      it("should transfer ERC20", async () => {
        await b3tr.mint(await treasuryProxy.getAddress(), ethers.parseEther("10"))
        expect(await treasuryProxy.getB3TRBalance()).to.eql(ethers.parseEther("18"))
        expect(await treasuryProxy.getTokenBalance(await b3tr.getAddress())).to.eql(ethers.parseEther("18"))
        await treasuryProxy.transferTokens(await b3tr.getAddress(), otherAccount.address, ethers.parseEther("8"))
        expect(await treasuryProxy.getTokenBalance(await b3tr.getAddress())).to.eql(ethers.parseEther("10"))
      })
      it("should revert if not enough balance", async () => {
        await catchRevert(
          treasuryProxy.transferTokens(await vot3.getAddress(), otherAccount.address, ethers.parseEther("6")),
        )
      })
      it("should revert if not called by GOVERNANCE_ROLE", async () => {
        await catchRevert(
          treasuryProxy
            .connect(otherAccount)
            .transferTokens(await vot3.getAddress(), otherAccount.address, ethers.parseEther("1")),
        )
      })
    })
    describe("NFT", () => {
      it("should transfer NFT", async () => {
        // Bootstrap emissions
        await bootstrapEmissions()

        // Should be able to free mint after participating in allocation voting
        await participateInAllocationVoting(otherAccount)

        await expect(await galaxyMember.connect(otherAccount).freeMint()).not.to.be.reverted

        expect(await galaxyMember.balanceOf(otherAccount.address)).to.equal(1)
        await expect(
          await galaxyMember
            .connect(otherAccount)
            .transferFrom(otherAccount.address, await treasuryProxy.getAddress(), 1),
        ).not.to.be.reverted
        const MAGIC_ON_ERC721_RECEIVED = "0x150b7a02"
        expect(
          await treasuryProxy.onERC721Received(owner.address, otherAccount.address, 1, ethers.toUtf8Bytes("")),
        ).to.equal(MAGIC_ON_ERC721_RECEIVED)
        expect(await galaxyMember.balanceOf(await treasuryProxy.getAddress())).to.equal(1)

        expect(await treasuryProxy.getCollectionNFTBalance(await galaxyMember.getAddress())).to.equal(1)
        await expect(await treasuryProxy.transferNFT(await galaxyMember.getAddress(), otherAccount.address, 1)).not.to
          .be.reverted
        expect(await treasuryProxy.getCollectionNFTBalance(await galaxyMember.getAddress())).to.equal(0)
      })
      it("should revert if not called by GOVERNANCE_ROLE", async () => {
        await catchRevert(
          treasuryProxy.connect(otherAccount).transferNFT(await galaxyMember.getAddress(), otherAccount.address, 1),
        )
      })
      it("should revert if not enough balance", async () => {
        await catchRevert(treasuryProxy.transferNFT(await galaxyMember.getAddress(), otherAccount.address, 1))
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
      expect(await treasury.getVETBalance()).to.eql(ethers.parseEther("9"))
    })
    it("should revert if not called by ADMIN_ROLE", async () => {
      const newTreasury = await ethers.getContractFactory("Treasury")
      const newImplementation = await newTreasury.deploy()
      const emptyBytes = new Uint8Array(0)
      await catchRevert(
        treasuryProxy.connect(otherAccount).upgradeToAndCall(await newImplementation.getAddress(), emptyBytes),
      )
    })
    it("should return correct version", async () => {
      expect(await treasuryProxy.getVersion()).to.eql("V1")
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
    let tProxy: Treasury
    let governor: B3TRGovernor
    before(async () => {
      const info = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      governor = info.governor

      tProxy = (await deployProxy("Treasury", [
        await info.b3tr.getAddress(),
        await info.vot3.getAddress(),
        await info.timeLock.getAddress(),
        owner.address,
        owner.address,
      ])) as Treasury

      await fundTreasuryVET(await tProxy.getAddress(), 10)
    })
    it("should execute transfer TX from proposal", async () => {
      const description = "Test Proposal: testing propsal for Transfer VET from tresausry"
      const treasuryContractFactory = await ethers.getContractFactory("Treasury")
      await bootstrapAndStartEmissions()

      await governor
        .connect(owner)
        .setWhitelistFunction(
          await tProxy.getAddress(),
          tProxy.interface.getFunction("transferVET").selector as string,
          true,
        )

      await createProposalAndExecuteIt(
        owner,
        otherAccount,
        tProxy,
        treasuryContractFactory,
        description,
        "transferVET",
        [owner.address, ethers.parseEther("5")],
      )

      expect(await tProxy.getVETBalance()).to.eql(ethers.parseEther("5"))
    })
  })
})
