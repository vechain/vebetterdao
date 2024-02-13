import { ethers } from "hardhat"
import { expect } from "chai"
import {
  calculateBaseAllocationOffChain,
  calculateVariableAppAllocationOffCahain,
  catchRevert,
  getOrDeployContractInstances,
  getVot3Tokens,
  startNewAllocationRound,
  waitForProposalToBeActive,
  waitForVotingPeriodToEnd,
} from "./helpers"
import { describe, it } from "mocha"

describe.only("X-Allocation Pool", async function () {
  describe("Allocation rewards for x-apps", async function () {
    it("Allocation rewards are calculated correctly", async function () {
      const { xAllocationVoting, otherAccounts, owner, xAllocationPool, emissions } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      const voter1 = otherAccounts[1]
      await getVot3Tokens(voter1, "1000")

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      await xAllocationVoting.connect(owner).addApp(otherAccounts[2].address, "My app", "")
      await xAllocationVoting.connect(owner).addApp(otherAccounts[3].address, "My app #2", "")

      //Start allocation round
      const round1 = await startNewAllocationRound(xAllocationVoting)
      // Vote
      await waitForProposalToBeActive(round1, xAllocationVoting)
      await xAllocationVoting
        .connect(voter1)
        .castVote(round1, [app1Id, app2Id], [ethers.parseEther("100"), ethers.parseEther("900")])

      await waitForVotingPeriodToEnd(round1, xAllocationVoting)
      let state = await xAllocationVoting.state(round1)
      expect(state).to.eql(BigInt(3))

      let app1Shares = await xAllocationPool.getAppShares(round1, app1Id)
      expect(app1Shares).to.eql(1000n)

      let app2Shares = await xAllocationPool.getAppShares(round1, app2Id)
      // should be capped to 15%
      let maxCapPercentage = await xAllocationPool.scaledAppSharesCap()
      expect(app2Shares).to.eql(maxCapPercentage)

      // Calculate base allocations
      let baseAllocationAmount = await xAllocationPool.baseAllocationAmount(round1)
      const expectedBaseAllocation = await calculateBaseAllocationOffChain(
        round1,
        emissions,
        xAllocationVoting,
        xAllocationPool,
      )
      expect(baseAllocationAmount).to.eql(expectedBaseAllocation)

      let expectedVariableAllcoation = await calculateVariableAppAllocationOffCahain(
        round1,
        app1Id,
        emissions,
        xAllocationPool,
      )
      let claimableRewards = await xAllocationPool.claimableAmount(round1, app1Id)
      expect(claimableRewards).to.eql(expectedVariableAllcoation + expectedBaseAllocation)

      // Calculate allocation rewards
      let allocationRewards = await xAllocationPool.realTimeAllocationRewards(round1, app1Id)
      expectedVariableAllcoation = await calculateVariableAppAllocationOffCahain(
        round1,
        app1Id,
        emissions,
        xAllocationPool,
      )
      expect(allocationRewards).to.eql(expectedBaseAllocation + expectedVariableAllcoation)

      allocationRewards = await xAllocationPool.realTimeAllocationRewards(round1, app2Id)
      expectedVariableAllcoation = await calculateVariableAppAllocationOffCahain(
        round1,
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
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, "My app", "")
      await xAllocationVoting.connect(owner).addApp(app2ReceiverAddress, "My app #2", "")

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())
      await emissions.connect(minterAccount).preMint()

      //Start allocation round
      const round1 = parseInt((await xAllocationVoting.currentRoundId()).toString())
      // Vote
      await waitForProposalToBeActive(round1, xAllocationVoting)
      await xAllocationVoting
        .connect(voter1)
        .castVote(round1, [app1Id, app2Id], [ethers.parseEther("100"), ethers.parseEther("900")])

      await waitForVotingPeriodToEnd(round1, xAllocationVoting)
      await xAllocationVoting.finalize(round1)

      // ENDED SEEDING DATA

      // CLAIMING
      let app1Revenue = await xAllocationPool.claimableAmount(round1, app1Id)
      let app2Revenue = await xAllocationPool.claimableAmount(round1, app2Id)

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
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, "My app", "")
      await xAllocationVoting.connect(owner).addApp(app2ReceiverAddress, "My app #2", "")

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())
      await emissions.connect(minterAccount).preMint()

      //Start allocation round
      const round1 = parseInt((await xAllocationVoting.currentRoundId()).toString())
      // Vote
      await waitForProposalToBeActive(round1, xAllocationVoting)
      await xAllocationVoting
        .connect(voter1)
        .castVote(round1, [app1Id, app2Id], [ethers.parseEther("100"), ethers.parseEther("900")])

      await waitForVotingPeriodToEnd(round1, xAllocationVoting)
      await xAllocationVoting.finalize(round1)

      // ENDED SEEDING DATA

      // CLAIMING

      await xAllocationPool.connect(otherAccounts[3]).claim(round1, app1Id)

      await catchRevert(xAllocationPool.connect(otherAccounts[3]).claim(round1, app1Id))
    })

    // anyone can trigger claiming of allocation to app
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
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, "My app", "")
      await xAllocationVoting.connect(owner).addApp(app2ReceiverAddress, "My app #2", "")

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())
      await emissions.connect(minterAccount).preMint()

      //Start allocation round
      const round1 = parseInt((await xAllocationVoting.currentRoundId()).toString())
      // Vote
      await waitForProposalToBeActive(round1, xAllocationVoting)
      await xAllocationVoting
        .connect(voter1)
        .castVote(round1, [app1Id, app2Id], [ethers.parseEther("100"), ethers.parseEther("900")])

      await waitForVotingPeriodToEnd(round1, xAllocationVoting)
      await xAllocationVoting.finalize(round1)

      // ENDED SEEDING DATA

      // CLAIMING
      let app1Revenue = await xAllocationPool.claimableAmount(round1, app1Id)

      let app1Balance = await b3tr.balanceOf(app1ReceiverAddress)
      expect(app1Balance).to.eql(0n)

      //claiming initiated by a random account
      await xAllocationPool.connect(otherAccounts[8]).claim(round1, app1Id)
      app1Balance = await b3tr.balanceOf(app1ReceiverAddress)
      expect(app1Balance).to.eql(app1Revenue)
    })

    it("Cannot claim failed not finalized round", async function () {
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
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, "My app", "")
      await xAllocationVoting.connect(owner).addApp(app2ReceiverAddress, "My app #2", "")

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())
      await emissions.connect(minterAccount).preMint()

      //Start allocation round
      const round1 = parseInt((await xAllocationVoting.currentRoundId()).toString())
      // Vote
      await waitForProposalToBeActive(round1, xAllocationVoting)
      await xAllocationVoting.connect(voter1).castVote(round1, [app1Id], [ethers.parseEther("1")])
      await waitForVotingPeriodToEnd(round1, xAllocationVoting)
      let state = await xAllocationVoting.state(round1)
      expect(state).to.eql(2n)

      // ROUND IS NOT FINALIZED
      // await xAllocationVoting.finalize(round1)

      // ENDED SEEDING DATA

      // CLAIMING
      await catchRevert(xAllocationPool.claim(round1, app1Id))
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
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, "My app", "")
      await xAllocationVoting.connect(owner).addApp(app2ReceiverAddress, "My app #2", "")

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())
      await emissions.connect(minterAccount).preMint()

      //Start allocation round
      const round1 = parseInt((await xAllocationVoting.currentRoundId()).toString())
      // Vote
      await waitForProposalToBeActive(round1, xAllocationVoting)
      await xAllocationVoting.connect(voter1).castVote(round1, [app1Id], [ethers.parseEther("1")])
      await waitForVotingPeriodToEnd(round1, xAllocationVoting)
      let state = await xAllocationVoting.state(round1)
      expect(state).to.eql(2n)

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
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, "My app", "")
      await xAllocationVoting.connect(owner).addApp(app2ReceiverAddress, "My app #2", "")

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())
      await emissions.connect(minterAccount).preMint()

      //Start allocation round
      const round1 = parseInt((await xAllocationVoting.currentRoundId()).toString())
      // Vote
      await waitForProposalToBeActive(round1, xAllocationVoting)

      // ROUND IS NOT FINALIZED
      // await xAllocationVoting.finalize(round1)

      // ENDED SEEDING DATA

      // CLAIMING
      await catchRevert(xAllocationPool.claim(round1, app1Id))
    })

    it("App can receive a max amount of allocation share", async function () {
      const { xAllocationVoting, otherAccounts, owner, xAllocationPool } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const voter1 = otherAccounts[1]
      await getVot3Tokens(voter1, "1000")

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      await xAllocationVoting.connect(owner).addApp(otherAccounts[3].address, "My app", "")
      await xAllocationVoting.connect(owner).addApp(otherAccounts[4].address, "My app #2", "")

      //Start allocation round
      const round1 = await startNewAllocationRound(xAllocationVoting)
      // Vote
      await waitForProposalToBeActive(round1, xAllocationVoting)
      await xAllocationVoting
        .connect(voter1)
        .castVote(round1, [app1Id, app2Id], [ethers.parseEther("100"), ethers.parseEther("900")])

      await waitForVotingPeriodToEnd(round1, xAllocationVoting)

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
      await xAllocationVoting.connect(owner).addApp(app1ReceiverAddress, "My app", "")
      await xAllocationVoting.connect(owner).addApp(app2ReceiverAddress, "My app #2", "")

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())
      await emissions.connect(minterAccount).preMint()

      //Start allocation round
      const round1 = parseInt((await xAllocationVoting.currentRoundId()).toString())
      // Nobody votes
      await waitForProposalToBeActive(round1, xAllocationVoting)
      await waitForVotingPeriodToEnd(round1, xAllocationVoting)
      await xAllocationVoting.finalize(round1)

      // ENDED SEEDING DATA

      // CLAIMING
      const baseAllocationAmount = await xAllocationPool.baseAllocationAmount(round1)

      let app1Revenue = await xAllocationPool.claimableAmount(round1, app1Id)
      let app2Revenue = await xAllocationPool.claimableAmount(round1, app2Id)
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
  })
})
