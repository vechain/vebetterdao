import { ethers } from "hardhat"
import { expect } from "chai"
import {
  catchRevert,
  createProposalAndExecuteIt,
  filterEventsByName,
  getOrDeployContractInstances,
  parseAlloctionProposalCreatedEvent,
  parseAppAddedEvent,
  startNewAllocationRound,
  waitForVotingPeriodToEnd,
} from "./helpers"
import { describe, it } from "mocha"

describe("X-Allocation Pool", function () {
  describe("Add app", function () {
    it("Should be able to add an app successfully", async function () {
      const { xAllocationPool, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      let tx = await xAllocationPool.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let appAdded = filterEventsByName(receipt.logs, "AppAdded")
      expect(appAdded).not.to.eql([])

      let { id, address } = parseAppAddedEvent(appAdded[0], xAllocationPool)
      expect(id).to.eql(app1Id)
      expect(address).to.eql(otherAccounts[0].address)
    })

    it("Should not be able to add an app if it is already added", async function () {
      const { xAllocationPool, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      await xAllocationPool.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")

      await catchRevert(xAllocationPool.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, ""))
    })

    it("Only admin address should be able to add an app", async function () {
      const { xAllocationPool, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: true })

      await catchRevert(
        xAllocationPool.connect(otherAccounts[0]).addApp(otherAccounts[0].address, otherAccounts[0].address, ""),
      )
    })

    it("Should be possible to add a new app through the DAO", async function () {
      const { xAllocationPool, otherAccounts, governor } = await getOrDeployContractInstances({ forceDeploy: true })

      const proposer = otherAccounts[0]
      const voter1 = otherAccounts[1]
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("Bike 4 Life"))

      // check that app does not exists
      await expect(xAllocationPool.getApp(app1Id)).to.be.reverted

      await createProposalAndExecuteIt(
        proposer,
        voter1,
        governor,
        xAllocationPool,
        await ethers.getContractFactory("XAllocationPool"),
        "Add app to the list",
        "addApp",
        [otherAccounts[1].address, "Bike 4 Life", ""],
      )

      // check that app was added
      const app = await xAllocationPool.getApp(app1Id)
      expect(app[0]).to.eql(app1Id)
      expect(app[1]).to.eql(otherAccounts[1].address)
      expect(app[2]).to.eql("Bike 4 Life")
      expect(app[3]).to.eql("")
    }).timeout(18000000)
  })

  describe("App availability for allocation voting", function () {
    it("Should be possible to add an app and make it available for allocation voting", async function () {
      const { xAllocationPool, otherAccounts, owner, xAllocationVoting } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const app1Id = await xAllocationPool.hashName(otherAccounts[0].address)

      await xAllocationPool.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")

      let roundId = await startNewAllocationRound(xAllocationVoting)

      const isEligibleForVote = await xAllocationPool.isEligibleForVote(app1Id, roundId)
      expect(isEligibleForVote).to.eql(true)
    })

    it("Admin can make an app unavailable for allocation voting starting from next round", async function () {
      const { xAllocationPool, otherAccounts, owner, xAllocationVoting } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const app1Id = await xAllocationPool.hashName(otherAccounts[0].address)
      await xAllocationPool.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")
      // check that eligibility was set
      expect(await xAllocationPool.isElegibleForVoteCurrentCheckpoint(app1Id)).to.eql(true)

      let round1 = await startNewAllocationRound(xAllocationVoting)

      await xAllocationPool.connect(owner).setAppVoteElegibility(app1Id, false)

      // check that eligibility was set
      expect(await xAllocationPool.isElegibleForVoteCurrentCheckpoint(app1Id)).to.eql(false)

      // app should still be eligible for the current round
      let isEligibleForVote = await xAllocationPool.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      await waitForVotingPeriodToEnd(round1, xAllocationVoting)
      let round2 = await startNewAllocationRound(xAllocationVoting)

      // app should not be elegible from this round
      isEligibleForVote = await xAllocationPool.isEligibleForVote(app1Id, round2)
      expect(isEligibleForVote).to.eql(false)

      // if checking for the previous round, it should still be eligible
      isEligibleForVote = await xAllocationPool.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)
    })

    it("DAO can make an app unavailable for allocation voting starting from next round", async function () {
      const { xAllocationPool, otherAccounts, governor, xAllocationVoting } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const app1Id = await xAllocationPool.hashName("Bike 4 Life")
      const proposer = otherAccounts[0]
      const voter1 = otherAccounts[1]

      // check that app does not exists
      await expect(xAllocationPool.getApp(app1Id)).to.be.reverted

      await createProposalAndExecuteIt(
        proposer,
        voter1,
        governor,
        xAllocationPool,
        await ethers.getContractFactory("XAllocationPool"),
        "Add app to the list",
        "addApp",
        [otherAccounts[0].address, "Bike 4 Life", ""],
      )

      let round1 = await startNewAllocationRound(xAllocationVoting)

      let isEligibleForVote = await xAllocationPool.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      await createProposalAndExecuteIt(
        proposer,
        voter1,
        governor,
        xAllocationPool,
        await ethers.getContractFactory("XAllocationPool"),
        "Exclude app from the allocation voting rounds",
        "setAppVoteElegibility",
        [app1Id, false],
      )

      // check that eligibility was set
      expect(await xAllocationPool.isElegibleForVoteCurrentCheckpoint(app1Id)).to.eql(false)

      // app should still be eligible for the current round
      isEligibleForVote = await xAllocationPool.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      await waitForVotingPeriodToEnd(round1, xAllocationVoting)
      let round2 = await startNewAllocationRound(xAllocationVoting)

      // app should not be elegible from this round
      isEligibleForVote = await xAllocationPool.isEligibleForVote(app1Id, round2)
      expect(isEligibleForVote).to.eql(false)
    })

    it("Non-admin address cannot make an app available or unavailable for allocation voting", async function () {
      const { xAllocationPool, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: false })

      const app1Id = await xAllocationPool.hashName(otherAccounts[0].address)

      await catchRevert(xAllocationPool.connect(otherAccounts[0]).setAppVoteElegibility(app1Id, true))
    })

    it("App needs to wait next round if added during an ongoing round", async function () {})
  })
})
