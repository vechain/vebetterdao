import { ethers } from "hardhat"
import { expect } from "chai"
import {
  bootstrapEmissions,
  calculateBaseAllocationOffChain,
  calculateUnallocatedAppAllocationOffChain,
  calculateVariableAppAllocationOffChain,
  catchRevert,
  getOrDeployContractInstances,
  getVot3Tokens,
  moveToCycle,
  startNewAllocationRound,
  waitForRoundToEnd,
} from "./helpers"
import { describe, it } from "mocha"
import { getImplementationAddress } from "@openzeppelin/upgrades-core"
import { XAllocationPoolJson } from ".."
import { createLocalConfig } from "@repo/config/contracts/envs/local"

describe("X-Allocation Pool", async function () {
  describe("Contract upgradeablity", () => {
    it("Admin should be able to upgrade the contract", async function () {
      const { xAllocationPool, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("XAllocationPool")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await xAllocationPool.getAddress())

      const UPGRADER_ROLE = await xAllocationPool.UPGRADER_ROLE()
      expect(await xAllocationPool.hasRole(UPGRADER_ROLE, owner.address)).to.eql(true)

      await expect(xAllocationPool.connect(owner).upgradeToAndCall(await implementation.getAddress(), "0x")).to.not.be
        .reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await xAllocationPool.getAddress())

      expect(newImplAddress.toUpperCase()).to.not.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.eql((await implementation.getAddress()).toUpperCase())
    })

    it("Only admin should be able to upgrade the contract", async function () {
      const { xAllocationPool, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("XAllocationPool")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await xAllocationPool.getAddress())

      const UPGRADER_ROLE = await xAllocationPool.UPGRADER_ROLE()
      expect(await xAllocationPool.hasRole(UPGRADER_ROLE, otherAccount.address)).to.eql(false)

      await expect(xAllocationPool.connect(otherAccount).upgradeToAndCall(await implementation.getAddress(), "0x")).to
        .be.reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await xAllocationPool.getAddress())

      expect(newImplAddress.toUpperCase()).to.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.not.eql((await implementation.getAddress()).toUpperCase())
    })

    it("Admin can change UPGRADER_ROLE", async function () {
      const { xAllocationPool, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("XAllocationPool")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await xAllocationPool.getAddress())

      const UPGRADER_ROLE = await xAllocationPool.UPGRADER_ROLE()
      expect(await xAllocationPool.hasRole(UPGRADER_ROLE, otherAccount.address)).to.eql(false)

      await expect(xAllocationPool.connect(owner).grantRole(UPGRADER_ROLE, otherAccount.address)).to.not.be.reverted
      await expect(xAllocationPool.connect(owner).revokeRole(UPGRADER_ROLE, owner.address)).to.not.be.reverted

      await expect(xAllocationPool.connect(otherAccount).upgradeToAndCall(await implementation.getAddress(), "0x")).to
        .not.be.reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await xAllocationPool.getAddress())

      expect(newImplAddress.toUpperCase()).to.not.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.eql((await implementation.getAddress()).toUpperCase())
    })
  })

  describe("Allocation rewards for x-apps", async function () {
    it("Allocation rewards are calculated correctly", async function () {
      const { xAllocationVoting, otherAccounts, owner, xAllocationPool, emissions, b3tr, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      const voter1 = otherAccounts[1]
      await getVot3Tokens(voter1, "1000")

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, "My app", "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, "My app #2", "metadataURI")

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await emissions.connect(minterAccount).start()

      const round1 = await xAllocationVoting.currentRoundId()

      // Vote
      await xAllocationVoting
        .connect(voter1)
        .castVote(round1, [app1Id, app2Id], [ethers.parseEther("100"), ethers.parseEther("900")])

      await waitForRoundToEnd(Number(round1), xAllocationVoting)
      let state = await xAllocationVoting.state(round1)
      expect(state).to.eql(BigInt(2))

      let app1Shares = await xAllocationPool.getAppShares(round1, app1Id)
      expect(app1Shares[0]).to.eql(1000n)
      expect(app1Shares[1]).to.eql(0n)

      let app2Shares = await xAllocationPool.getAppShares(round1, app2Id)
      // should be capped to 20%
      // Remaining 70% should be retuned as unallocated
      let maxCapPercentage = await xAllocationPool.scaledAppSharesCap(round1)
      expect(app2Shares[0]).to.eql(maxCapPercentage)
      expect(app2Shares[1]).to.eql(7000n) // (alloctaedVotes)90% - app1Shares(20%) = 70%

      // Calculate base allocations
      let baseAllocationAmount = await xAllocationPool.baseAllocationAmount(round1)
      const expectedBaseAllocation = await calculateBaseAllocationOffChain(Number(round1), emissions, xAllocationVoting)
      expect(baseAllocationAmount).to.eql(expectedBaseAllocation)

      let expectedVariableAllcoation = await calculateVariableAppAllocationOffChain(
        Number(round1),
        app1Id,
        emissions,
        xAllocationPool,
        xAllocationVoting,
      )
      let claimableRewards = await xAllocationPool.roundEarnings(round1, app1Id)
      expect(claimableRewards[0]).to.eql(expectedVariableAllcoation + expectedBaseAllocation)

      // Calculate allocation rewards
      let allocationRewards = await xAllocationPool.currentRoundEarnings(app1Id)
      expectedVariableAllcoation = await calculateVariableAppAllocationOffChain(
        Number(round1),
        app1Id,
        emissions,
        xAllocationPool,
        xAllocationVoting,
      )
      expect(allocationRewards).to.eql(expectedBaseAllocation + expectedVariableAllcoation)

      allocationRewards = await xAllocationPool.currentRoundEarnings(app2Id)
      expectedVariableAllcoation = await calculateVariableAppAllocationOffChain(
        Number(round1),
        app2Id,
        emissions,
        xAllocationPool,
        xAllocationVoting,
      )
      expect(allocationRewards).to.eql(expectedBaseAllocation + expectedVariableAllcoation)
    })

    it("Allocation rewards are claimed correctly", async function () {
      const { xAllocationVoting, otherAccounts, owner, xAllocationPool, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // SEED DATA

      const voter1 = otherAccounts[1]
      await getVot3Tokens(voter1, "1000")

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      const app1ReceiverAddress = otherAccounts[3].address
      const app2ReceiverAddress = otherAccounts[4].address
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, app1ReceiverAddress, "My app", "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(app2ReceiverAddress, app2ReceiverAddress, "My app #2", "metadataURI")

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await emissions.connect(minterAccount).start()

      //Start allocation round
      const round1 = parseInt((await xAllocationVoting.currentRoundId()).toString())
      // Vote
      await xAllocationVoting
        .connect(voter1)
        .castVote(round1, [app1Id, app2Id], [ethers.parseEther("100"), ethers.parseEther("900")])

      await waitForRoundToEnd(round1, xAllocationVoting)
      await xAllocationVoting.finalize(round1)

      // ENDED SEEDING DATA

      // CLAIMING
      let app1Revenue = await xAllocationPool.roundEarnings(round1, app1Id)
      let app2Revenue = await xAllocationPool.roundEarnings(round1, app2Id)

      let app1Balance = await b3tr.balanceOf(app1ReceiverAddress)
      let app2Balance = await b3tr.balanceOf(app2ReceiverAddress)

      expect(app1Balance).to.eql(0n)
      expect(app2Balance).to.eql(0n)

      await xAllocationPool.connect(otherAccounts[3]).claim(round1, app1Id)
      await xAllocationPool.connect(otherAccounts[4]).claim(round1, app2Id)

      app1Balance = await b3tr.balanceOf(app1ReceiverAddress)
      app2Balance = await b3tr.balanceOf(app2ReceiverAddress)

      expect(app1Balance).to.eql(app1Revenue[0])
      expect(app2Balance).to.eql(app2Revenue[0])
    })

    it("Unclaimed rewards are returned to the treasury", async function () {
      const { xAllocationVoting, otherAccounts, owner, xAllocationPool, b3tr, emissions, minterAccount, treasury } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // SEED DATA

      const voter1 = otherAccounts[1]
      await getVot3Tokens(voter1, "1000")

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      const app1ReceiverAddress = otherAccounts[3].address
      const app2ReceiverAddress = otherAccounts[4].address
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, app1ReceiverAddress, "My app", "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(app2ReceiverAddress, app2ReceiverAddress, "My app #2", "metadataURI")

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await emissions.connect(minterAccount).start()

      //Start allocation round
      const round1 = parseInt((await xAllocationVoting.currentRoundId()).toString())
      // Vote
      await xAllocationVoting
        .connect(voter1)
        .castVote(round1, [app1Id, app2Id], [ethers.parseEther("100"), ethers.parseEther("900")])

      await waitForRoundToEnd(round1, xAllocationVoting)
      await xAllocationVoting.finalize(round1)

      // ENDED SEEDING DATA

      // CLAIMING
      let app1Revenue = await xAllocationPool.roundEarnings(round1, app1Id)
      let app2Revenue = await xAllocationPool.roundEarnings(round1, app2Id)

      const treasuryBalanceBefore = await b3tr.balanceOf(await treasury.getAddress())

      await xAllocationPool.connect(otherAccounts[3]).claim(round1, app1Id)
      await xAllocationPool.connect(otherAccounts[4]).claim(round1, app2Id)

      const treasuryBalanceAfter = await b3tr.balanceOf(await treasury.getAddress())

      expect(treasuryBalanceAfter).to.eql(treasuryBalanceBefore + app1Revenue[1] + app2Revenue[1])
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.be.gt(0)
    })

    it("App cannot claim two times in the same round", async function () {
      const { xAllocationVoting, otherAccounts, owner, xAllocationPool, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // SEED DATA

      const voter1 = otherAccounts[1]
      await getVot3Tokens(voter1, "1000")

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      const app1ReceiverAddress = otherAccounts[3].address
      const app2ReceiverAddress = otherAccounts[4].address
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, app1ReceiverAddress, "My app", "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(app2ReceiverAddress, app2ReceiverAddress, "My app #2", "metadataURI")

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await emissions.connect(minterAccount).start()

      //Start allocation round
      const round1 = parseInt((await xAllocationVoting.currentRoundId()).toString())
      // Vote
      await xAllocationVoting
        .connect(voter1)
        .castVote(round1, [app1Id, app2Id], [ethers.parseEther("100"), ethers.parseEther("900")])

      await waitForRoundToEnd(round1, xAllocationVoting)
      await xAllocationVoting.finalize(round1)

      // ENDED SEEDING DATA

      // CLAIMING

      await xAllocationPool.connect(otherAccounts[3]).claim(round1, app1Id)

      await catchRevert(xAllocationPool.connect(otherAccounts[3]).claim(round1, app1Id))
    })

    it("Anyone can trigger claiming of allocation to app", async function () {
      const { xAllocationVoting, otherAccounts, owner, xAllocationPool, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // SEED DATA

      const voter1 = otherAccounts[1]
      await getVot3Tokens(voter1, "1000")

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      const app1ReceiverAddress = otherAccounts[3].address
      const app2ReceiverAddress = otherAccounts[4].address
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, app1ReceiverAddress, "My app", "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(app2ReceiverAddress, app2ReceiverAddress, "My app #2", "metadataURI")

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await emissions.connect(minterAccount).start()

      //Start allocation round
      const round1 = parseInt((await xAllocationVoting.currentRoundId()).toString())
      // Vote
      await xAllocationVoting
        .connect(voter1)
        .castVote(round1, [app1Id, app2Id], [ethers.parseEther("100"), ethers.parseEther("900")])

      await waitForRoundToEnd(round1, xAllocationVoting)
      await xAllocationVoting.finalize(round1)

      // ENDED SEEDING DATA

      // CLAIMING
      let app1Revenue = await xAllocationPool.roundEarnings(round1, app1Id)

      let app1Balance = await b3tr.balanceOf(app1ReceiverAddress)
      expect(app1Balance).to.eql(0n)

      //claiming initiated by a random account
      await xAllocationPool.connect(otherAccounts[8]).claim(round1, app1Id)
      app1Balance = await b3tr.balanceOf(app1ReceiverAddress)
      expect(app1Balance).to.eql(app1Revenue[0])
    })

    it("Can claim first round even if it's not finalized", async function () {
      const { xAllocationVoting, otherAccounts, owner, xAllocationPool, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // SEED DATA

      const voter1 = otherAccounts[1]
      await getVot3Tokens(voter1, "1000")

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app1ReceiverAddress = otherAccounts[3].address
      const app2ReceiverAddress = otherAccounts[4].address
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, app1ReceiverAddress, "My app", "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(app2ReceiverAddress, app2ReceiverAddress, "My app #2", "metadataURI")

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await emissions.connect(minterAccount).start()

      //Start allocation round
      const round1 = parseInt((await xAllocationVoting.currentRoundId()).toString())
      // Vote
      await xAllocationVoting.connect(voter1).castVote(round1, [app1Id], [ethers.parseEther("1")])
      await waitForRoundToEnd(round1, xAllocationVoting)

      // expect it's failed
      let state = await xAllocationVoting.state(round1)
      expect(state).to.eql(1n)

      // ROUND IS NOT FINALIZED
      // await xAllocationVoting.finalize(round1)

      // ENDED SEEDING DATA

      // CLAIMING
      await xAllocationPool.claim(round1, app1Id)
    })

    it("Can claim failed not finalized round [ROUND > 1]", async function () {
      const { xAllocationVoting, otherAccounts, owner, xAllocationPool, emissions, b3tr, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      const voter1 = otherAccounts[1]
      await getVot3Tokens(voter1, "1000")

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, "My app", "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, "My app #2", "metadataURI")

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await emissions.connect(minterAccount).start()

      const round1 = await xAllocationVoting.currentRoundId()

      // Vote
      await xAllocationVoting
        .connect(voter1)
        .castVote(round1, [app1Id, app2Id], [ethers.parseEther("100"), ethers.parseEther("900")])

      await waitForRoundToEnd(Number(round1), xAllocationVoting)
      // round 1 should be succeed
      let state = await xAllocationVoting.state(round1)
      expect(state).to.eql(2n)

      // Now we can go to round 2 and test our scenario
      await emissions.connect(minterAccount).distribute()

      const round2 = await xAllocationVoting.currentRoundId()
      expect(round2).to.eql(2n)

      await waitForRoundToEnd(Number(round2), xAllocationVoting)
      // expect it's failed
      state = await xAllocationVoting.state(round2)
      expect(state).to.eql(1n)

      // ROUND IS NOT FINALIZED
      const isFinalized = await xAllocationVoting.isFinalized(round2)
      expect(isFinalized).to.eql(false)

      // CLAIMING
      expect(await xAllocationPool.claim(round1, app1Id)).not.to.be.reverted
    })

    it("Can claim failed round after it's finalized", async function () {
      const { xAllocationVoting, otherAccounts, owner, xAllocationPool, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // SEED DATA

      const voter1 = otherAccounts[1]
      await getVot3Tokens(voter1, "1000")

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app1ReceiverAddress = otherAccounts[3].address
      const app2ReceiverAddress = otherAccounts[4].address
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, app1ReceiverAddress, "My app", "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(app2ReceiverAddress, app2ReceiverAddress, "My app #2", "metadataURI")

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await emissions.connect(minterAccount).start()

      //Start allocation round
      const round1 = parseInt((await xAllocationVoting.currentRoundId()).toString())
      // Vote
      await xAllocationVoting.connect(voter1).castVote(round1, [app1Id], [ethers.parseEther("1")])
      await waitForRoundToEnd(round1, xAllocationVoting)

      // expect it's failed
      let state = await xAllocationVoting.state(round1)
      expect(state).to.eql(1n)

      // ROUND IS FINALIZED
      await xAllocationVoting.finalize(round1)

      // ENDED SEEDING DATA

      // CLAIMING
      expect(await xAllocationPool.claim(round1, app1Id)).not.to.be.reverted
    })

    it("Cannot claim active round", async function () {
      const { xAllocationVoting, otherAccounts, owner, xAllocationPool, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // SEED DATA

      const voter1 = otherAccounts[1]
      await getVot3Tokens(voter1, "1000")

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app1ReceiverAddress = otherAccounts[3].address
      const app2ReceiverAddress = otherAccounts[4].address
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, app1ReceiverAddress, "My app", "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(app2ReceiverAddress, app2ReceiverAddress, "My app #2", "metadataURI")

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await emissions.connect(minterAccount).start()

      //Start allocation round
      const round1 = parseInt((await xAllocationVoting.currentRoundId()).toString())

      let state = await xAllocationVoting.state(round1)
      expect(state).to.eql(0n)

      // CLAIMING
      await catchRevert(xAllocationPool.claim(round1, app1Id))
    })

    it("App can receive a max amount of allocation share and unallocated amount gets sent to treasury", async function () {
      const { xAllocationVoting, otherAccounts, owner, xAllocationPool, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      const voter1 = otherAccounts[1]
      await getVot3Tokens(voter1, "1000")

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, "My app", "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[4].address, otherAccounts[4].address, "My app #2", "metadataURI")

      //Start allocation round
      const round1 = await startNewAllocationRound(xAllocationVoting)
      // Vote
      await xAllocationVoting
        .connect(voter1)
        .castVote(round1, [app1Id, app2Id], [ethers.parseEther("100"), ethers.parseEther("900")])

      await waitForRoundToEnd(round1, xAllocationVoting)

      // expect not to be cupped since it's lower than maxCapPercentage
      let app1Shares = await xAllocationPool.getAppShares(round1, app1Id)
      expect(app1Shares[0]).to.eql(1000n)

      let app2Shares = await xAllocationPool.getAppShares(round1, app2Id)

      // should be capped to 20%
      let maxCapPercentage = await xAllocationPool.scaledAppSharesCap(round1)
      expect(app2Shares[0]).to.eql(maxCapPercentage)
      expect(app2Shares[1]).to.eql(7000n) // 100% - baseAllocation(10%) - app1Shares(20%) = 70%
    })

    it("Every app in the round receives a base allocation", async function () {
      const { xAllocationVoting, otherAccounts, owner, xAllocationPool, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // SEED DATA

      const voter1 = otherAccounts[1]
      await getVot3Tokens(voter1, "1000")

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      const app1ReceiverAddress = otherAccounts[3].address
      const app2ReceiverAddress = otherAccounts[4].address
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, app1ReceiverAddress, "My app", "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(app2ReceiverAddress, app2ReceiverAddress, "My app #2", "metadataURI")

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await emissions.connect(minterAccount).start()

      //Start allocation round
      const round1 = parseInt((await xAllocationVoting.currentRoundId()).toString())
      // Nobody votes
      await waitForRoundToEnd(round1, xAllocationVoting)
      await xAllocationVoting.finalize(round1)

      // ENDED SEEDING DATA

      // CLAIMING
      const baseAllocationAmount = await xAllocationPool.baseAllocationAmount(round1)

      let app1Revenue = await xAllocationPool.roundEarnings(round1, app1Id)
      let app2Revenue = await xAllocationPool.roundEarnings(round1, app2Id)
      expect(app1Revenue[0]).to.eql(baseAllocationAmount)
      expect(app2Revenue[0]).to.eql(baseAllocationAmount)

      let app1Balance = await b3tr.balanceOf(app1ReceiverAddress)
      let app2Balance = await b3tr.balanceOf(app2ReceiverAddress)

      expect(app1Balance).to.eql(0n)
      expect(app2Balance).to.eql(0n)

      await xAllocationPool.claim(round1, app1Id)
      await xAllocationPool.claim(round1, app2Id)

      app1Balance = await b3tr.balanceOf(app1ReceiverAddress)
      app2Balance = await b3tr.balanceOf(app2ReceiverAddress)

      expect(app1Balance).to.eql(baseAllocationAmount)
      expect(app2Balance).to.eql(baseAllocationAmount)
    })

    it("New app of failed round receives a base allocation even if it was not elegible in previous round", async function () {
      const { xAllocationVoting, otherAccounts, owner, xAllocationPool, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // SEED DATA

      const voter1 = otherAccounts[1]
      await getVot3Tokens(voter1, "1000")

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      const app1ReceiverAddress = otherAccounts[3].address
      const app2ReceiverAddress = otherAccounts[4].address
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, app1ReceiverAddress, "My app", "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(app2ReceiverAddress, app2ReceiverAddress, "My app #2", "metadataURI")

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await emissions.connect(minterAccount).start()

      //Start allocation round
      const round1 = parseInt((await xAllocationVoting.currentRoundId()).toString())

      await xAllocationVoting
        .connect(voter1)
        .castVote(round1, [app1Id, app2Id], [ethers.parseEther("100"), ethers.parseEther("900")])

      await waitForRoundToEnd(round1, xAllocationVoting)
      await xAllocationVoting.finalize(round1)

      let state = await xAllocationVoting.state(round1)
      // should be succeeded
      expect(state).to.eql(2n)

      // new emission, new round and new app
      const app3Id = ethers.keccak256(ethers.toUtf8Bytes("My app #3"))
      const app3ReceiverAddress = otherAccounts[4].address
      await xAllocationVoting
        .connect(owner)
        .addApp(app3ReceiverAddress, app3ReceiverAddress, "My app #3", "metadataURI")
      await moveToCycle(emissions, minterAccount, 3)
      const round2 = parseInt((await xAllocationVoting.currentRoundId()).toString())
      expect(round2).to.eql(2)

      await xAllocationVoting.connect(voter1).castVote(round2, [app3Id], [ethers.parseEther("1")])
      await waitForRoundToEnd(round2, xAllocationVoting)
      await xAllocationVoting.finalize(round2)

      state = await xAllocationVoting.state(round2)
      // should be failed
      expect(state).to.eql(1n)

      const baseAllocationAmount = await xAllocationPool.baseAllocationAmount(round2)

      let round1Votes = await xAllocationVoting.getAppVotes(round1, app3Id)
      expect(round1Votes).to.eql(0n)
      let round2Votes = await xAllocationVoting.getAppVotes(round2, app3Id)
      expect(round2Votes).to.eql(ethers.parseEther("1"))

      let app3Revenue = await xAllocationPool.roundEarnings(round2, app3Id)
      expect(app3Revenue[0]).to.eql(baseAllocationAmount)

      let app3Balance = await b3tr.balanceOf(app3ReceiverAddress)
      expect(app3Balance).to.eql(0n)

      await xAllocationPool.claim(round2, app3Id)

      app3Balance = await b3tr.balanceOf(app3ReceiverAddress)
      expect(app3Balance).to.eql(baseAllocationAmount)
    })

    it("App shares cap and unallocated share of a past round and should remain the same even if value has been updated", async function () {
      const { xAllocationVoting, otherAccounts, owner, xAllocationPool, emissions, b3tr, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      const voter1 = otherAccounts[1]
      await getVot3Tokens(voter1, "2000")

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, "My app", "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, "My app #2", "metadataURI")

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await emissions.connect(minterAccount).start()

      const round1 = await xAllocationVoting.currentRoundId()

      // Vote
      await xAllocationVoting
        .connect(voter1)
        .castVote(round1, [app1Id, app2Id], [ethers.parseEther("1000"), ethers.parseEther("0")])

      await waitForRoundToEnd(Number(round1), xAllocationVoting)
      let state = await xAllocationVoting.state(round1)
      expect(state).to.eql(BigInt(2))

      // Update cap
      await xAllocationVoting.connect(owner).setAppSharesCap(50)

      await xAllocationVoting.connect(owner).startNewRound()

      const round2 = await xAllocationVoting.currentRoundId()

      // Vote
      await xAllocationVoting
        .connect(voter1)
        .castVote(round2, [app1Id, app2Id], [ethers.parseEther("1000"), ethers.parseEther("0")])

      await waitForRoundToEnd(Number(round2), xAllocationVoting)

      const expectedBaseAllocationR1 = await calculateBaseAllocationOffChain(
        Number(round1),
        emissions,
        xAllocationVoting,
      )
      let expectedVariableAllocationR1App1 = await calculateVariableAppAllocationOffChain(
        Number(round1),
        app1Id,
        emissions,
        xAllocationPool,
        xAllocationVoting,
      )
      const expecteUnallocatedAllocationR1App1 = await calculateUnallocatedAppAllocationOffChain(
        Number(round1),
        app1Id,
        emissions,
        xAllocationPool,
        xAllocationVoting,
      )

      // should be capped to 20%
      let maxCapPercentageR1 = await xAllocationPool.scaledAppSharesCap(round1)
      const appSharesR1A1 = await xAllocationPool.getAppShares(round1, app1Id)
      expect(appSharesR1A1[0]).to.eql(maxCapPercentageR1)
      // Unallocated amount should be 80%
      expect(appSharesR1A1[1]).to.eql(8000n) // 100% - appShareCap(20%) = 80%

      // should be capped to 50%
      let maxCapPercentageR2 = await xAllocationPool.scaledAppSharesCap(round2)
      const appSharesR2A1 = await xAllocationPool.getAppShares(round2, app1Id)
      expect(appSharesR2A1[0]).to.eql(maxCapPercentageR2)
      // Unallocated amount should be 50%
      expect(appSharesR2A1[1]).to.eql(5000n) // 100% - appShareCap(50%) = 50%

      let claimableRewardsR1App1 = await xAllocationPool.roundEarnings(round1, app1Id)
      expect(claimableRewardsR1App1[0]).to.eql(expectedVariableAllocationR1App1 + expectedBaseAllocationR1)
      expect(claimableRewardsR1App1[1]).to.eql(expecteUnallocatedAllocationR1App1)

      const expectedBaseAllocationR2 = await calculateBaseAllocationOffChain(
        Number(round2),
        emissions,
        xAllocationVoting,
      )
      let expectedVariableAllocationR2App1 = await calculateVariableAppAllocationOffChain(
        Number(round2),
        app1Id,
        emissions,
        xAllocationPool,
        xAllocationVoting,
      )
      const expecteUnallocatedAllocationR2App1 = await calculateUnallocatedAppAllocationOffChain(
        Number(round2),
        app1Id,
        emissions,
        xAllocationPool,
        xAllocationVoting,
      )

      let claimableRewardsR2App1 = await xAllocationPool.roundEarnings(round2, app1Id)
      expect(claimableRewardsR2App1[0]).to.eql(expectedVariableAllocationR2App1 + expectedBaseAllocationR2)
      expect(claimableRewardsR2App1[1]).to.eql(expecteUnallocatedAllocationR2App1)
    })

    it("Base allocation of a past round should remain the same even if value has been updated", async function () {
      const { xAllocationVoting, otherAccounts, owner, xAllocationPool, emissions, b3tr, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      const voter1 = otherAccounts[1]
      await getVot3Tokens(voter1, "2000")

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, "My app", "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, "My app #2", "metadataURI")

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await emissions.connect(minterAccount).start()

      const round1 = await xAllocationVoting.currentRoundId()

      // Vote
      await xAllocationVoting
        .connect(voter1)
        .castVote(round1, [app1Id, app2Id], [ethers.parseEther("1000"), ethers.parseEther("0")])

      await waitForRoundToEnd(Number(round1), xAllocationVoting)
      let state = await xAllocationVoting.state(round1)
      expect(state).to.eql(BigInt(2))

      // Update BaseAllocationPercentage
      await xAllocationVoting.connect(owner).setBaseAllocationPercentage(50)

      await xAllocationVoting.connect(owner).startNewRound()

      const round2 = await xAllocationVoting.currentRoundId()

      // Vote
      await xAllocationVoting
        .connect(voter1)
        .castVote(round2, [app1Id, app2Id], [ethers.parseEther("1000"), ethers.parseEther("0")])

      await waitForRoundToEnd(Number(round2), xAllocationVoting)

      const expectedBaseAllocationR1 = await calculateBaseAllocationOffChain(
        Number(round1),
        emissions,
        xAllocationVoting,
      )
      let expectedVariableAllocationR1App1 = await calculateVariableAppAllocationOffChain(
        Number(round1),
        app1Id,
        emissions,
        xAllocationPool,
        xAllocationVoting,
      )

      let claimableRewardsR1App1 = await xAllocationPool.roundEarnings(round1, app1Id)
      expect(claimableRewardsR1App1[0]).to.eql(expectedVariableAllocationR1App1 + expectedBaseAllocationR1)

      const expectedBaseAllocationR2 = await calculateBaseAllocationOffChain(
        Number(round2),
        emissions,
        xAllocationVoting,
      )
      let expectedVariableAllocationR2App1 = await calculateVariableAppAllocationOffChain(
        Number(round2),
        app1Id,
        emissions,
        xAllocationPool,
        xAllocationVoting,
      )
      let claimableRewardsR2App1 = await xAllocationPool.roundEarnings(round2, app1Id)
      expect(claimableRewardsR2App1[0]).to.eql(expectedVariableAllocationR2App1 + expectedBaseAllocationR2)
    })

    it("Should calculate correct app shares with Quadratic funding distrubiton with max cap at 20%", async function () {
      const { xAllocationVoting, otherAccounts, owner, b3tr, emissions, minterAccount, xAllocationPool } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      otherAccounts.forEach(async account => {
        await getVot3Tokens(account, "10000")
      })

      //Add apps
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, otherAccounts[3].address, "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[4].address, otherAccounts[4].address, otherAccounts[4].address, "metadataURI")
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[3].address))
      const app3Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[4].address))

      //Start allocation round
      const round1 = await startNewAllocationRound(xAllocationVoting)
      // Vote
      await xAllocationVoting
        .connect(otherAccounts[1])
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("900"), ethers.parseEther("100")],
        )
      await xAllocationVoting
        .connect(otherAccounts[2])
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("500"), ethers.parseEther("100")],
        )
      await xAllocationVoting
        .connect(otherAccounts[3])
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("100"), ethers.parseEther("100")],
        )
      await xAllocationVoting
        .connect(otherAccounts[4])
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("100"), ethers.parseEther("100")],
        )
      await xAllocationVoting
        .connect(otherAccounts[5])
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("1000"), ethers.parseEther("0"), ethers.parseEther("100")],
        )

      await waitForRoundToEnd(round1, xAllocationVoting)

      const app1Shares = await xAllocationPool.getAppShares(round1, app1Id)
      const app2Shares = await xAllocationPool.getAppShares(round1, app2Id)
      const app3Shares = await xAllocationPool.getAppShares(round1, app3Id)

      expect(app1Shares[0]).to.eql(1144n)
      expect(app2Shares[0]).to.eql(2000n) // reached cap would be 59.94% of the total votes
      expect(app3Shares[0]).to.eql(2000n) // reached cap would be 28.61% of the total votes
    })

    it("Should calculate correct app shares with Quadratic funding distrubiton with no max cap", async function () {
      const config = createLocalConfig()
      config.X_ALLOCATION_POOL_APP_SHARES_MAX_CAP = 100
      const { xAllocationVoting, otherAccounts, owner, b3tr, emissions, minterAccount, xAllocationPool } =
        await getOrDeployContractInstances({
          forceDeploy: true,
          config,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      otherAccounts.forEach(async account => {
        await getVot3Tokens(account, "10000")
      })

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      const app3Id = ethers.keccak256(ethers.toUtf8Bytes("My app #3"))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, "My app", "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[4].address, otherAccounts[4].address, "My app #2", "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[5].address, otherAccounts[5], "My app #3", "metadataURI")

      //Start allocation round
      const round1 = await startNewAllocationRound(xAllocationVoting)
      // Vote
      await xAllocationVoting
        .connect(otherAccounts[1])
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("900"), ethers.parseEther("100")],
        )
      await xAllocationVoting
        .connect(otherAccounts[2])
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("500"), ethers.parseEther("100")],
        )
      await xAllocationVoting
        .connect(otherAccounts[3])
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("100"), ethers.parseEther("100")],
        )
      await xAllocationVoting
        .connect(otherAccounts[4])
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("100"), ethers.parseEther("100")],
        )
      await xAllocationVoting
        .connect(otherAccounts[5])
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("1000"), ethers.parseEther("0"), ethers.parseEther("100")],
        )

      await waitForRoundToEnd(round1, xAllocationVoting)

      const app1Shares = await xAllocationPool.getAppShares(round1, app1Id)
      const app2Shares = await xAllocationPool.getAppShares(round1, app2Id)
      const app3Shares = await xAllocationPool.getAppShares(round1, app3Id)

      expect(app1Shares[0]).to.eql(1144n)
      expect(app2Shares[0]).to.eql(5993n) // reached cap would be 59.94% of the total votes
      expect(app3Shares[0]).to.eql(2861n) // reached cap would be 28.61% of the total votes
    })

    it("Should give correct rewards based with Quadratic Funding", async function () {
      const config = createLocalConfig()
      config.X_ALLOCATION_POOL_APP_SHARES_MAX_CAP = 100
      config.X_ALLOCATION_POOL_BASE_ALLOCATION_PERCENTAGE = 0
      config.INITIAL_X_ALLOCATION = 10000n
      const { xAllocationVoting, otherAccounts, owner, b3tr, emissions, minterAccount, xAllocationPool } =
        await getOrDeployContractInstances({
          forceDeploy: true,
          config,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      otherAccounts.forEach(async account => {
        await getVot3Tokens(account, "10000")
      })

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      const app3Id = ethers.keccak256(ethers.toUtf8Bytes("My app #3"))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, "My app", "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[4].address, otherAccounts[4].address, "My app #2", "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[5].address, otherAccounts[5].address, "My app #3", "metadataURI")

      //Start allocation round
      const round1 = await startNewAllocationRound(xAllocationVoting)
      // Vote
      await xAllocationVoting
        .connect(otherAccounts[1])
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("900"), ethers.parseEther("100")],
        )
      await xAllocationVoting
        .connect(otherAccounts[2])
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("500"), ethers.parseEther("100")],
        )
      await xAllocationVoting
        .connect(otherAccounts[3])
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("100"), ethers.parseEther("100")],
        )
      await xAllocationVoting
        .connect(otherAccounts[4])
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("100"), ethers.parseEther("100")],
        )
      await xAllocationVoting
        .connect(otherAccounts[5])
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("1000"), ethers.parseEther("0"), ethers.parseEther("100")],
        )

      await waitForRoundToEnd(round1, xAllocationVoting)

      const app1app1Earnings = await xAllocationPool.roundEarnings(round1, app1Id)
      const app2app2Earnings = await xAllocationPool.roundEarnings(round1, app2Id)
      const app3app3Earnings = await xAllocationPool.roundEarnings(round1, app3Id)

      expect(app1app1Earnings[0]).to.eql(1144n)
      expect(app2app2Earnings[0]).to.eql(5993n)
      expect(app3app3Earnings[0]).to.eql(2861n)
    })
  })

  it("Should correctly count live earnings when current round failed (round > 1 )", async function () {
    const { xAllocationVoting, otherAccounts, owner, xAllocationPool, emissions, b3tr, minterAccount } =
      await getOrDeployContractInstances({
        forceDeploy: true,
      })

    const voter1 = otherAccounts[1]
    await getVot3Tokens(voter1, "1000")

    //Add apps
    const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
    const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
    await xAllocationVoting
      .connect(owner)
      .addApp(otherAccounts[2].address, otherAccounts[2].address, "My app", "metadataURI")
    await xAllocationVoting
      .connect(owner)
      .addApp(otherAccounts[3].address, otherAccounts[3].address, "My app #2", "metadataURI")

    // Bootstrap emissions
    await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

    await emissions.connect(minterAccount).start()

    const round1 = await xAllocationVoting.currentRoundId()

    // Vote
    await xAllocationVoting
      .connect(voter1)
      .castVote(round1, [app1Id, app2Id], [ethers.parseEther("100"), ethers.parseEther("900")])

    await waitForRoundToEnd(Number(round1), xAllocationVoting)
    let state = await xAllocationVoting.state(round1)
    expect(state).to.eql(2n)

    // Now we can go to round 2 and test our scenario
    await emissions.connect(minterAccount).distribute()
    const baseAllocationAmount = await xAllocationPool.baseAllocationAmount(round1)

    const round2 = await xAllocationVoting.currentRoundId()
    expect(round2).to.eql(2n)

    let realTimeApp1 = await xAllocationPool.currentRoundEarnings(app1Id)
    expect(realTimeApp1).to.eql(baseAllocationAmount)

    let realTimeApp2 = await xAllocationPool.currentRoundEarnings(app2Id)
    expect(realTimeApp2).to.eql(baseAllocationAmount)

    await waitForRoundToEnd(Number(round2), xAllocationVoting)

    // Now round ended but a new one did not started so this should happen:
    // 1 - real time earnings should use shares from previous round -> earnings should be the same as previous round
    const round1App1Earnings = await xAllocationPool.roundEarnings(round1, app1Id)
    const round1App2Earnings = await xAllocationPool.roundEarnings(round1, app2Id)

    realTimeApp1 = await xAllocationPool.currentRoundEarnings(app1Id)
    expect(realTimeApp1).to.eql(round1App1Earnings[0])

    realTimeApp2 = await xAllocationPool.currentRoundEarnings(app2Id)
    expect(realTimeApp2).to.eql(round1App2Earnings[0])
  })

  it("User should be able to check his available earnings to claim", async function () {
    const { xAllocationVoting, otherAccounts, owner, xAllocationPool, emissions, b3tr, minterAccount } =
      await getOrDeployContractInstances({
        forceDeploy: true,
      })

    const voter1 = otherAccounts[1]
    await getVot3Tokens(voter1, "1000")

    //Add apps
    const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
    const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
    await xAllocationVoting
      .connect(owner)
      .addApp(otherAccounts[6].address, otherAccounts[6].address, "My app", "metadataURI")
    await xAllocationVoting
      .connect(owner)
      .addApp(otherAccounts[7].address, otherAccounts[7].address, "My app #2", "metadataURI")

    // Bootstrap emissions
    await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

    await emissions.connect(minterAccount).start()

    const round1 = await xAllocationVoting.currentRoundId()

    // Vote
    await xAllocationVoting
      .connect(voter1)
      .castVote(round1, [app1Id, app2Id], [ethers.parseEther("100"), ethers.parseEther("900")])

    await waitForRoundToEnd(Number(round1), xAllocationVoting)
    let state = await xAllocationVoting.state(round1)
    expect(state).to.eql(2n)

    let app1Shares = await xAllocationPool.getAppShares(round1, app1Id)
    expect(app1Shares[0]).to.eql(1000n)

    const claimableAmount = await xAllocationPool.claimableAmount(round1, app1Id)
    const expectedEarnings = await xAllocationPool.roundEarnings(round1, app1Id)
    expect(claimableAmount[0]).to.eql(expectedEarnings[0])

    let userBalance = await b3tr.balanceOf(otherAccounts[6].address)

    expect(userBalance).to.eql(0n)

    await xAllocationPool.connect(otherAccounts[6]).claim(round1, app1Id)

    // balance of user should be equal to expected earnings
    userBalance = await b3tr.balanceOf(otherAccounts[6].address)
    expect(userBalance).to.eql(claimableAmount[0])

    // claimable amount should be 0
    const claimableAmountAfterClaim = await xAllocationPool.claimableAmount(round1, app1Id)
    expect(claimableAmountAfterClaim[0]).to.eql(0n)
  })

  it("When adding new app previous allocations should remain the same", async function () {
    const { xAllocationVoting, otherAccounts, owner, xAllocationPool, emissions, b3tr, minterAccount } =
      await getOrDeployContractInstances({
        forceDeploy: true,
      })

    const voter1 = otherAccounts[1]
    await getVot3Tokens(voter1, "1000")

    //Add apps
    const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
    const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
    const app3Id = ethers.keccak256(ethers.toUtf8Bytes("My app #3")) // to add later
    await xAllocationVoting
      .connect(owner)
      .addApp(otherAccounts[2].address, otherAccounts[2].address, "My app", "metadataURI")
    await xAllocationVoting
      .connect(owner)
      .addApp(otherAccounts[3].address, otherAccounts[3].address, "My app #2", "metadataURI")

    // Bootstrap emissions
    await bootstrapEmissions(b3tr, emissions, owner, minterAccount)
    await emissions.connect(minterAccount).start()

    const round1 = await xAllocationVoting.currentRoundId()

    // Vote
    await xAllocationVoting
      .connect(voter1)
      .castVote(round1, [app1Id, app2Id], [ethers.parseEther("100"), ethers.parseEther("900")])

    await waitForRoundToEnd(Number(round1), xAllocationVoting)
    let state = await xAllocationVoting.state(round1)
    expect(state).to.eql(BigInt(2))

    const app1Earnings = await xAllocationPool.roundEarnings(round1, app1Id)
    const app2Earnings = await xAllocationPool.roundEarnings(round1, app2Id)
    const app3Earnings = await xAllocationPool.roundEarnings(round1, app3Id)
    expect(app3Earnings[0]).to.eql(0n)

    const baseAllocationAmountBeforeAddingApp3 = await xAllocationPool.baseAllocationAmount(round1)

    // Add new app
    await xAllocationVoting
      .connect(owner)
      .addApp(otherAccounts[4].address, otherAccounts[4].address, "My app #3", "metadataURI")

    // Start new round
    await emissions.distribute()

    expect(app1Earnings).to.eql(await xAllocationPool.roundEarnings(round1, app1Id))
    expect(app2Earnings).to.eql(await xAllocationPool.roundEarnings(round1, app2Id))
    expect(app3Earnings).to.eql(await xAllocationPool.roundEarnings(round1, app3Id))
    expect((await xAllocationPool.roundEarnings(round1, app3Id))[0]).to.eql(0n)

    expect(baseAllocationAmountBeforeAddingApp3).to.eql(await xAllocationPool.baseAllocationAmount(round1))

    await waitForRoundToEnd(Number(await xAllocationVoting.currentRoundId()), xAllocationVoting)

    // remove app
    await xAllocationVoting.connect(owner).setVotingElegibility(app3Id, false)

    // Start new round
    await emissions.distribute()

    const round3 = await xAllocationVoting.currentRoundId()

    // Vote
    await xAllocationVoting
      .connect(voter1)
      .castVote(round3, [app1Id, app2Id], [ethers.parseEther("100"), ethers.parseEther("900")])

    await waitForRoundToEnd(Number(round3), xAllocationVoting)
    state = await xAllocationVoting.state(round3)
    expect(state).to.eql(BigInt(2))

    const app1EarningsInRound3 = await xAllocationPool.roundEarnings(round3, app1Id)
    const app2EarningsInRound3 = await xAllocationPool.roundEarnings(round3, app2Id)
    const app3EarningsInRound3 = await xAllocationPool.roundEarnings(round3, app3Id)
    expect(app3EarningsInRound3[0]).to.eql(0n)

    // add again
    await xAllocationVoting.connect(owner).setVotingElegibility(app3Id, true)

    // Start new round
    await emissions.distribute()

    expect(app1EarningsInRound3).to.eql(await xAllocationPool.roundEarnings(round3, app1Id))
    expect(app2EarningsInRound3).to.eql(await xAllocationPool.roundEarnings(round3, app2Id))
    expect(app3EarningsInRound3).to.eql(await xAllocationPool.roundEarnings(round3, app3Id))
    expect((await xAllocationPool.roundEarnings(round3, app3Id))[0]).to.eql(0n)
  })
})
