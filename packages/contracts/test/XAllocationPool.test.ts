import { ethers } from "hardhat"
import { expect } from "chai"
import {
  bootstrapEmissions,
  calculateBaseAllocationOffChain,
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

describe("X-Allocation Pool", async function () {
  describe("Deploy", async function () {
    it.only("Admin should be able to upgrade the contract", async function () {
      const { xAllocationPool, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("XAllocationPool")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await xAllocationPool.getAddress())

      const DEFAULT_ADMIN_ROLE = await xAllocationPool.DEFAULT_ADMIN_ROLE()
      expect(await xAllocationPool.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.eql(true)

      await expect(xAllocationPool.connect(owner).upgradeToAndCall(await implementation.getAddress(), "0x")).to.not.be
        .reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await xAllocationPool.getAddress())

      expect(newImplAddress.toUpperCase()).to.not.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.eql((await implementation.getAddress()).toUpperCase())
    })

    it.only("Only admin should be able to upgrade the contract", async function () {
      const { xAllocationPool, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("XAllocationPool")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await xAllocationPool.getAddress())

      const DEFAULT_ADMIN_ROLE = await xAllocationPool.DEFAULT_ADMIN_ROLE()
      expect(await xAllocationPool.hasRole(DEFAULT_ADMIN_ROLE, otherAccount.address)).to.eql(false)

      await expect(xAllocationPool.connect(otherAccount).upgradeToAndCall(await implementation.getAddress(), "0x")).to
        .be.reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await xAllocationPool.getAddress())

      expect(newImplAddress.toUpperCase()).to.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.not.eql((await implementation.getAddress()).toUpperCase())
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
      await xAllocationVoting.connect(owner).addApp(otherAccounts[2].address, "My app")
      await xAllocationVoting.connect(owner).addApp(otherAccounts[3].address, "My app #2")

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
      expect(app1Shares).to.eql(1000n)

      let app2Shares = await xAllocationPool.getAppShares(round1, app2Id)
      // should be capped to 15%
      let maxCapPercentage = await xAllocationPool.scaledAppSharesCap()
      expect(app2Shares).to.eql(maxCapPercentage)

      // Calculate base allocations
      let baseAllocationAmount = await xAllocationPool.baseAllocationAmount(round1)
      const expectedBaseAllocation = await calculateBaseAllocationOffChain(
        Number(round1),
        emissions,
        xAllocationVoting,
        xAllocationPool,
      )
      expect(baseAllocationAmount).to.eql(expectedBaseAllocation)

      let expectedVariableAllcoation = await calculateVariableAppAllocationOffChain(
        Number(round1),
        app1Id,
        emissions,
        xAllocationPool,
      )
      let claimableRewards = await xAllocationPool.roundEarnings(round1, app1Id)
      expect(claimableRewards).to.eql(expectedVariableAllcoation + expectedBaseAllocation)

      // Calculate allocation rewards
      let allocationRewards = await xAllocationPool.currentRoundEarnings(app1Id)
      expectedVariableAllcoation = await calculateVariableAppAllocationOffChain(
        Number(round1),
        app1Id,
        emissions,
        xAllocationPool,
      )
      expect(allocationRewards).to.eql(expectedBaseAllocation + expectedVariableAllcoation)

      allocationRewards = await xAllocationPool.currentRoundEarnings(app2Id)
      expectedVariableAllcoation = await calculateVariableAppAllocationOffChain(
        Number(round1),
        app2Id,
        emissions,
        xAllocationPool,
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
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, "My app")
      await xAllocationVoting.connect(owner).addApp(app2ReceiverAddress, "My app #2")

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

      expect(app1Balance).to.eql(app1Revenue)
      expect(app2Balance).to.eql(app2Revenue)
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
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, "My app")
      await xAllocationVoting.connect(owner).addApp(app2ReceiverAddress, "My app #2")

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
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, "My app")
      await xAllocationVoting.connect(owner).addApp(app2ReceiverAddress, "My app #2")

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
      expect(app1Balance).to.eql(app1Revenue)
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
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, "My app")
      await xAllocationVoting.connect(owner).addApp(app2ReceiverAddress, "My app #2")

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
      await xAllocationVoting.connect(owner).addApp(otherAccounts[2].address, "My app")
      await xAllocationVoting.connect(owner).addApp(otherAccounts[3].address, "My app #2")

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
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, "My app")
      await xAllocationVoting.connect(owner).addApp(app2ReceiverAddress, "My app #2")

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
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, "My app")
      await xAllocationVoting.connect(owner).addApp(app2ReceiverAddress, "My app #2")

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

    it("App can receive a max amount of allocation share", async function () {
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
      await xAllocationVoting.connect(owner).addApp(otherAccounts[3].address, "My app")
      await xAllocationVoting.connect(owner).addApp(otherAccounts[4].address, "My app #2")

      //Start allocation round
      const round1 = await startNewAllocationRound(xAllocationVoting)
      // Vote
      await xAllocationVoting
        .connect(voter1)
        .castVote(round1, [app1Id, app2Id], [ethers.parseEther("100"), ethers.parseEther("900")])

      await waitForRoundToEnd(round1, xAllocationVoting)

      // expect not to be cupped since it's lower than maxCapPercentage
      let app1Shares = await xAllocationPool.getAppShares(round1, app1Id)
      expect(app1Shares).to.eql(1000n)

      let app2Shares = await xAllocationPool.getAppShares(round1, app2Id)
      // should be capped to 15%
      let maxCapPercentage = await xAllocationPool.scaledAppSharesCap()
      expect(app2Shares).to.eql(maxCapPercentage)
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
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, "My app")
      await xAllocationVoting.connect(owner).addApp(app2ReceiverAddress, "My app #2")

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
      expect(app1Revenue).to.eql(baseAllocationAmount)
      expect(app2Revenue).to.eql(baseAllocationAmount)

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
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, "My app")
      await xAllocationVoting.connect(owner).addApp(app2ReceiverAddress, "My app #2")

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
      await xAllocationVoting.connect(owner).addApp(app3ReceiverAddress, "My app #3")
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
      expect(app3Revenue).to.eql(baseAllocationAmount)

      let app3Balance = await b3tr.balanceOf(app3ReceiverAddress)
      expect(app3Balance).to.eql(0n)

      await xAllocationPool.claim(round2, app3Id)

      app3Balance = await b3tr.balanceOf(app3ReceiverAddress)
      expect(app3Balance).to.eql(baseAllocationAmount)
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
    await xAllocationVoting.connect(owner).addApp(otherAccounts[2].address, "My app")
    await xAllocationVoting.connect(owner).addApp(otherAccounts[3].address, "My app #2")

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
    expect(realTimeApp1).to.eql(round1App1Earnings)

    realTimeApp2 = await xAllocationPool.currentRoundEarnings(app2Id)
    expect(realTimeApp2).to.eql(round1App2Earnings)
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
    await xAllocationVoting.connect(owner).addApp(otherAccounts[6].address, "My app")
    await xAllocationVoting.connect(owner).addApp(otherAccounts[7].address, "My app #2")

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
    expect(app1Shares).to.eql(1000n)

    const claimableAmount = await xAllocationPool.claimableAmount(round1, app1Id)
    const expectedEarnings = await xAllocationPool.roundEarnings(round1, app1Id)
    expect(claimableAmount).to.eql(expectedEarnings)

    let userBalance = await b3tr.balanceOf(otherAccounts[6].address)

    expect(userBalance).to.eql(0n)

    await xAllocationPool.connect(otherAccounts[6]).claim(round1, app1Id)

    // balance of user should be equal to expected earnings
    userBalance = await b3tr.balanceOf(otherAccounts[6].address)
    expect(userBalance).to.eql(claimableAmount)

    // claimable amount should be 0
    const claimableAmountAfterClaim = await xAllocationPool.claimableAmount(round1, app1Id)
    expect(claimableAmountAfterClaim).to.eql(0n)
  })
})
