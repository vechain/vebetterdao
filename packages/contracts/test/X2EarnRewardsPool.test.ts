import { ethers } from "hardhat"
import { expect } from "chai"
import {
  ZERO_ADDRESS,
  bootstrapAndStartEmissions,
  bootstrapEmissions,
  catchRevert,
  createProposalAndExecuteIt,
  decodeEvent,
  filterEventsByName,
  getOrDeployContractInstances,
  getVot3Tokens,
  parseAppAddedEvent,
  startNewAllocationRound,
  waitForCurrentRoundToEnd,
  waitForRoundToEnd,
} from "./helpers"
import { describe, it } from "mocha"
import { getImplementationAddress } from "@openzeppelin/upgrades-core"
import { deployProxy } from "../scripts/helpers"

describe.only("X2EarnRewardsPool", function () {
  // deployment
  describe("Deployment", function () {
    it("Cannot deploy contract with zero address", async function () {
      const { owner } = await getOrDeployContractInstances({
        forceDeploy: false,
      })

      await expect(deployProxy("X2EarnRewardsPool", [owner.address, owner.address, owner.address, ZERO_ADDRESS])).to.be
        .reverted

      await expect(deployProxy("X2EarnRewardsPool", [owner.address, owner.address, ZERO_ADDRESS, owner.address])).to.be
        .reverted

      await expect(deployProxy("X2EarnRewardsPool", [owner.address, ZERO_ADDRESS, owner.address, owner.address])).to.be
        .reverted

      await expect(deployProxy("X2EarnRewardsPool", [ZERO_ADDRESS, owner.address, owner.address, owner.address])).to.be
        .reverted
    })

    it("Should deploy the contract", async function () {
      const { x2EarnRewardsPool } = await getOrDeployContractInstances({ forceDeploy: true })
      expect(await x2EarnRewardsPool.getAddress()).to.not.equal(ZERO_ADDRESS)
    })

    it("Should set B3TR correctly", async function () {
      const { x2EarnRewardsPool, b3tr } = await getOrDeployContractInstances({ forceDeploy: false })
      expect(await x2EarnRewardsPool.b3tr()).to.equal(await b3tr.getAddress())
    })

    it("Version should be set correctly", async function () {
      const { x2EarnRewardsPool } = await getOrDeployContractInstances({ forceDeploy: false })
      expect(await x2EarnRewardsPool.version()).to.equal("1")
    })

    it("X2EarnApps should be set correctly", async function () {
      const { x2EarnRewardsPool, x2EarnApps } = await getOrDeployContractInstances({ forceDeploy: false })
      expect(await x2EarnRewardsPool.x2EarnApps()).to.equal(await x2EarnApps.getAddress())
    })
  })

  // upgradeability
  describe("Contract upgradeablity", () => {
    it("Cannot initialize twice", async function () {
      const { x2EarnRewardsPool, owner, b3tr, x2EarnApps } = await getOrDeployContractInstances({ forceDeploy: true })
      await catchRevert(
        x2EarnRewardsPool.initialize(
          await owner.getAddress(),
          await owner.getAddress(),
          await b3tr.getAddress(),
          await x2EarnApps.getAddress(),
        ),
      )
    })

    it("User with UPGRADER_ROLE should be able to upgrade the contract", async function () {
      const { x2EarnRewardsPool, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("X2EarnRewardsPool")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await x2EarnRewardsPool.getAddress())

      const UPGRADER_ROLE = await x2EarnRewardsPool.UPGRADER_ROLE()
      expect(await x2EarnRewardsPool.hasRole(UPGRADER_ROLE, owner.address)).to.eql(true)

      await expect(x2EarnRewardsPool.connect(owner).upgradeToAndCall(await implementation.getAddress(), "0x")).to.not.be
        .reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await x2EarnRewardsPool.getAddress())

      expect(newImplAddress.toUpperCase()).to.not.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.eql((await implementation.getAddress()).toUpperCase())
    })

    it("Only user with UPGRADER_ROLE should be able to upgrade the contract", async function () {
      const { x2EarnRewardsPool, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("X2EarnRewardsPool")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await x2EarnRewardsPool.getAddress())

      const UPGRADER_ROLE = await x2EarnRewardsPool.UPGRADER_ROLE()
      expect(await x2EarnRewardsPool.hasRole(UPGRADER_ROLE, otherAccount.address)).to.eql(false)

      await expect(x2EarnRewardsPool.connect(otherAccount).upgradeToAndCall(await implementation.getAddress(), "0x")).to
        .be.reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await x2EarnRewardsPool.getAddress())

      expect(newImplAddress.toUpperCase()).to.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.not.eql((await implementation.getAddress()).toUpperCase())
    })

    it("Should return correct version of the contract", async () => {
      const { x2EarnApps } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.version()).to.equal("1")
    })
  })

  // settings
  describe("Settings", function () {})

  // deposit
  describe("Deposit", function () {
    // everyone can deposit
    it("Anyone can deposit", async function () {
      const { x2EarnRewardsPool, x2EarnApps, b3tr, owner, minterAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
        bootstrapAndStartEmissions: true,
      })
      const amount = ethers.parseEther("100")

      await b3tr.connect(minterAccount).mint(owner.address, amount)

      // create app
      await x2EarnApps.addApp(owner.address, owner.address, "My app", "metadataURI")
      await x2EarnApps.addApp(owner.address, owner.address, "My app #2", "metadataURI")

      await b3tr.connect(owner).approve(await x2EarnRewardsPool.getAddress(), amount)
      await x2EarnRewardsPool.connect(owner).deposit(amount, await x2EarnApps.hashAppName("My app"))

      expect(await b3tr.balanceOf(await x2EarnRewardsPool.getAddress())).to.equal(amount)
    })

    // app must exist
    it("Should not allow deposit to non-existing app", async function () {
      const { x2EarnRewardsPool, b3tr, owner, x2EarnApps } = await getOrDeployContractInstances({
        forceDeploy: true,
        bootstrapAndStartEmissions: true,
      })
      const amount = ethers.parseEther("100")

      await b3tr.connect(owner).approve(await x2EarnRewardsPool.getAddress(), amount)
      await catchRevert(x2EarnRewardsPool.connect(owner).deposit(amount, await x2EarnApps.hashAppName("My app")))
    })

    // owner must approve token
    it("Should not allow deposit without approval", async function () {
      const { x2EarnRewardsPool, x2EarnApps, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
        bootstrapAndStartEmissions: true,
      })
      const amount = ethers.parseEther("100")

      await x2EarnApps.addApp(owner.address, owner.address, "My app", "metadataURI")

      await catchRevert(x2EarnRewardsPool.connect(owner).deposit(amount, await x2EarnApps.hashAppName("My app")))
    })

    it("Should emit Deposit event", async function () {
      const { x2EarnRewardsPool, x2EarnApps, b3tr, owner, otherAccount, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
          bootstrapAndStartEmissions: true,
        })

      const amount = ethers.parseEther("100")

      await b3tr.connect(minterAccount).mint(otherAccount.address, amount)

      await x2EarnApps.addApp(owner.address, owner.address, "My app", "metadataURI")

      await b3tr.connect(otherAccount).approve(await x2EarnRewardsPool.getAddress(), amount)
      const tx = await x2EarnRewardsPool.connect(otherAccount).deposit(amount, await x2EarnApps.hashAppName("My app"))
      const receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let event = filterEventsByName(receipt.logs, "NewDeposit")
      expect(event).not.to.eql([])

      expect(event[0].args[0]).to.equal(amount)
      expect(event[0].args[1]).to.equal(await x2EarnApps.hashAppName("My app"))
      expect(event[0].args[2]).to.equal(otherAccount.address)
    })
  })
  // withdraw
  describe("Withdraw", function () {
    it("The admin of the app can withdraw", async function () {
      const { x2EarnRewardsPool, x2EarnApps, b3tr, owner, otherAccounts, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
          bootstrapAndStartEmissions: true,
        })

      const teamWallet = otherAccounts[10]

      const amount = ethers.parseEther("100")

      await b3tr.connect(minterAccount).mint(owner.address, amount)

      await x2EarnApps.addApp(teamWallet.address, owner.address, "My app", "metadataURI")

      await b3tr.connect(owner).approve(await x2EarnRewardsPool.getAddress(), amount)
      await x2EarnRewardsPool.connect(owner).deposit(amount, await x2EarnApps.hashAppName("My app"))

      expect(await b3tr.balanceOf(teamWallet.address)).to.equal(0n)

      await x2EarnRewardsPool
        .connect(owner)
        .withdraw(ethers.parseEther("1"), await x2EarnApps.hashAppName("My app"), "")

      expect(await b3tr.balanceOf(await x2EarnRewardsPool.getAddress())).to.equal(ethers.parseEther("99"))

      // money are sent to team wallet
      expect(await b3tr.balanceOf(teamWallet.address)).to.equal(ethers.parseEther("1"))

      // can leave a reason
      const tx = await x2EarnRewardsPool
        .connect(owner)
        .withdraw(ethers.parseEther("1"), await x2EarnApps.hashAppName("My app"), "For the team")

      // "Should emit Withdraw event"
      const receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let event = filterEventsByName(receipt.logs, "TeamWithdrawal")
      expect(event).not.to.eql([])
      expect(event[0].args[0]).to.equal(ethers.parseEther("1"))
      expect(event[0].args[1]).to.equal(await x2EarnApps.hashAppName("My app"))
      expect(event[0].args[2]).to.equal(teamWallet.address)
      expect(event[0].args[3]).to.equal(owner.address)
      expect(event[0].args[4]).to.equal("For the team")
    })

    it("App must exist", async function () {
      const { x2EarnRewardsPool, b3tr, owner, x2EarnApps } = await getOrDeployContractInstances({
        forceDeploy: true,
        bootstrapAndStartEmissions: true,
      })

      await b3tr.connect(owner).approve(await x2EarnRewardsPool.getAddress(), ethers.parseEther("100"))

      await catchRevert(
        x2EarnRewardsPool.connect(owner).withdraw(ethers.parseEther("1"), await x2EarnApps.hashAppName("My app"), ""),
      )
    })

    it("Only admin can withdraw", async function () {
      const { x2EarnRewardsPool, x2EarnApps, b3tr, owner, otherAccount, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
          bootstrapAndStartEmissions: true,
        })

      const teamWallet = otherAccount

      const amount = ethers.parseEther("100")

      await b3tr.connect(minterAccount).mint(owner.address, amount)

      await x2EarnApps.addApp(teamWallet.address, owner.address, "My app", "metadataURI")

      await b3tr.connect(owner).approve(await x2EarnRewardsPool.getAddress(), amount)
      await x2EarnRewardsPool.connect(owner).deposit(amount, await x2EarnApps.hashAppName("My app"))

      await catchRevert(
        x2EarnRewardsPool
          .connect(otherAccount)
          .withdraw(ethers.parseEther("1"), await x2EarnApps.hashAppName("My app"), ""),
      )
    })

    it("Cannot withdraw as admin of another app", async function () {
      const { x2EarnRewardsPool, x2EarnApps, b3tr, owner, otherAccount, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
          bootstrapAndStartEmissions: true,
        })

      const teamWallet = otherAccount

      const amount = ethers.parseEther("100")

      await b3tr.connect(minterAccount).mint(owner.address, amount)

      await x2EarnApps.addApp(teamWallet.address, owner.address, "My app", "metadataURI")
      await x2EarnApps.addApp(owner.address, owner.address, "My app #2", "metadataURI")

      await b3tr.connect(owner).approve(await x2EarnRewardsPool.getAddress(), amount)
      await x2EarnRewardsPool.connect(owner).deposit(amount, await x2EarnApps.hashAppName("My app"))

      await catchRevert(
        x2EarnRewardsPool
          .connect(teamWallet)
          .withdraw(ethers.parseEther("1"), await x2EarnApps.hashAppName("My app"), ""),
      )
    })

    it("App must have enough available funds to withdraw", async function () {
      const { x2EarnRewardsPool, x2EarnApps, b3tr, owner, otherAccount, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
          bootstrapAndStartEmissions: true,
        })

      const teamWallet = otherAccount

      const amount = ethers.parseEther("100")

      await b3tr.connect(minterAccount).mint(owner.address, amount)

      await x2EarnApps.addApp(teamWallet.address, owner.address, "My app", "metadataURI")

      await b3tr.connect(owner).approve(await x2EarnRewardsPool.getAddress(), amount)
      await x2EarnRewardsPool.connect(owner).deposit(amount, await x2EarnApps.hashAppName("My app"))

      await catchRevert(
        x2EarnRewardsPool.connect(owner).withdraw(ethers.parseEther("101"), await x2EarnApps.hashAppName("My app"), ""),
      )
    })
  })
  // distributeRewards
})
