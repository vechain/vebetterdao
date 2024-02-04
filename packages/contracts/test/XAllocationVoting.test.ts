import { ethers } from "hardhat"
import { expect } from "chai"
import {
  catchRevert,
  createProposalAndExecuteIt,
  filterEventsByName,
  getOrDeployContractInstances,
  getVot3Tokens,
  parseAllocationVoteCastEvent,
  parseAlloctionProposalCreatedEvent,
  waitForProposalToBeActive,
  waitForVotingPeriodToEnd,
} from "./helpers"
import { describe, it } from "mocha"

describe.only("XAllocation Voting", function () {
  describe("Deployment", function () {
    it("Admins and addresses should be set correctly", async function () {
      const { xAllocationVoting, xAllocationPool, owner, timeLock } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      const ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000"

      expect(await xAllocationVoting.hasRole(ADMIN_ROLE, await timeLock.getAddress())).to.eql(true)
      expect(await xAllocationVoting.hasRole(ADMIN_ROLE, owner.address)).to.eql(true)

      expect(await xAllocationVoting.getXAllocationPoolAddress()).to.eql(await xAllocationPool.getAddress())
      expect(await xAllocationVoting.getB3trGovernorAddress()).to.eql(await timeLock.getAddress())
    })
  })
  describe("Settings", function () {
    it("Should be able to change x-allocation pool address", async function () {
      const { xAllocationVoting, otherAccounts, governor } = await getOrDeployContractInstances({
        forceDeploy: false,
      })

      const initialAddress = await xAllocationVoting.getXAllocationPoolAddress()
      expect(initialAddress).to.exist

      await createProposalAndExecuteIt(
        otherAccounts[1],
        otherAccounts[2],
        governor,
        xAllocationVoting,
        await ethers.getContractFactory("XAllocationVoting"),
        "Update xAllocationPool address in XAllocationVoting",
        "setXAllocationPoolAddress",
        [otherAccounts[3].address],
      )

      const updatedAddress = await xAllocationVoting.getXAllocationPoolAddress()
      expect(updatedAddress).to.eql(otherAccounts[3].address)
    })

    // should be able to change quorum

    // should be able to change voting period

    // should be able to change voting delay

    // should be able to change B3trGovernanceAddress
  })

  describe("Allocation rounds", function () {
    it("Should be able to propose a new allocation round successfully", async function () {
      const { xAllocationVoting, xAllocationPool, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await xAllocationPool.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, true)

      let tx = await xAllocationVoting.proposeNewAllocationRound("First allocation round")
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      // Event should be emitted
      let allocationProposalCreated = filterEventsByName(receipt.logs, "AllocationProposalCreated")
      expect(allocationProposalCreated).not.to.eql([])

      let { proposalId } = parseAlloctionProposalCreatedEvent(allocationProposalCreated[0], xAllocationVoting)
      expect(proposalId).to.eql(BigInt(1))

      //Prposal should be pending
      let proposalState = await xAllocationVoting.state(proposalId)
      expect(proposalState).to.eql(BigInt(0))

      await waitForProposalToBeActive(proposalId, xAllocationVoting)

      // Prposal should be active
      proposalState = await xAllocationVoting.state(proposalId)
      expect(proposalState).to.eql(BigInt(1))
    })

    it("Should not be able to propose a new allocation round if there is an active one", async function () {
      const { xAllocationVoting, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await getVot3Tokens(otherAccount, "1000")

      let tx = await xAllocationVoting.proposeNewAllocationRound("First allocation round")
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      // Event should be emitted
      let allocationProposalCreated = filterEventsByName(receipt.logs, "AllocationProposalCreated")
      expect(allocationProposalCreated).not.to.eql([])

      let { proposalId } = parseAlloctionProposalCreatedEvent(allocationProposalCreated[0], xAllocationVoting)

      //Prposal should be pending
      let proposalState = await xAllocationVoting.state(proposalId)
      expect(proposalState).to.eql(BigInt(0))

      // should not be able to propose a new allocation round if there is an active one
      await catchRevert(xAllocationVoting.proposeNewAllocationRound("First allocation round"))

      await waitForProposalToBeActive(proposalId, xAllocationVoting)

      // should not be able to propose a new allocation round if there is an active one
      await catchRevert(xAllocationVoting.proposeNewAllocationRound("First allocation round"))
    })

    it("Should be able to propose a new allocation round if the previous one ended", async function () {
      const { xAllocationVoting, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await getVot3Tokens(otherAccount, "1000")

      let tx = await xAllocationVoting.proposeNewAllocationRound("First allocation round")
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      // Event should be emitted
      let allocationProposalCreated = filterEventsByName(receipt.logs, "AllocationProposalCreated")
      let { proposalId } = parseAlloctionProposalCreatedEvent(allocationProposalCreated[0], xAllocationVoting)

      await waitForProposalToBeActive(proposalId, xAllocationVoting)
      await waitForVotingPeriodToEnd(proposalId, xAllocationVoting)

      // should not be able to propose a new allocation round if there is an active one
      tx = await xAllocationVoting.proposeNewAllocationRound("Second allocation round")
      receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      allocationProposalCreated = filterEventsByName(receipt.logs, "AllocationProposalCreated")
      expect(allocationProposalCreated).not.to.eql([])
      ;({ proposalId } = parseAlloctionProposalCreatedEvent(allocationProposalCreated[0], xAllocationVoting))

      expect(proposalId).to.eql(BigInt(2))
    })

    it("At least one app needed to propose a new allocation round", async function () {})
  })

  describe("Allocation Voting", function () {
    it("I cannot cast a vote with higher balance than I have", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, xAllocationPool, owner } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      await xAllocationPool.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, true)
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      await getVot3Tokens(otherAccount, "1000")

      let tx = await xAllocationVoting.proposeNewAllocationRound("First allocation round")
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")
      // Event should be emitted
      let allocationProposalCreated = filterEventsByName(receipt.logs, "AllocationProposalCreated")
      let { proposalId } = parseAlloctionProposalCreatedEvent(allocationProposalCreated[0], xAllocationVoting)

      await waitForProposalToBeActive(proposalId, xAllocationVoting)

      // I cannot cast a vote with higher balance than I have
      await catchRevert(
        xAllocationVoting.connect(otherAccount).castVote(proposalId, [app1], [ethers.parseEther("1500")]),
      )
    })
    it("I should be able to cast a vote", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, xAllocationPool, owner } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })
      await xAllocationPool.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, true)
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      await getVot3Tokens(otherAccount, "1000")

      let tx = await xAllocationVoting.proposeNewAllocationRound("First allocation round")
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")
      // Event should be emitted
      let allocationProposalCreated = filterEventsByName(receipt.logs, "AllocationProposalCreated")
      let { proposalId } = parseAlloctionProposalCreatedEvent(allocationProposalCreated[0], xAllocationVoting)

      await waitForProposalToBeActive(proposalId, xAllocationVoting)

      // I should be able to cast a vote
      tx = await xAllocationVoting.connect(otherAccount).castVote(proposalId, [app1], [ethers.parseEther("500")])
      receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let allocationVoteCast = filterEventsByName(receipt.logs, "AllocationVoteCast")
      expect(allocationProposalCreated).not.to.eql([])

      let {
        voter,
        apps: votedApps,
        voteWeights,
        proposalId: votedProposalId,
      } = parseAllocationVoteCastEvent(allocationVoteCast[0], xAllocationVoting)
      expect(voter).to.eql(otherAccount.address)
      expect(votedProposalId).to.eql(proposalId)
      expect(votedApps).to.eql([app1])
      expect(voteWeights).to.eql([ethers.parseEther("500")])

      // Votes should be tracked correctly
      let appVotes = await xAllocationVoting.getAppVotes(proposalId, app1)
      expect(appVotes).to.eql(ethers.parseEther("500"))

      let totalVotes = await xAllocationVoting.getAllocationRoundTotalVotes(proposalId)
      expect(totalVotes).to.eql(ethers.parseEther("500"))
    })

    it("I should not be able to cast vote twice", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, xAllocationPool, owner } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })
      await xAllocationPool.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, true)
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      await getVot3Tokens(otherAccount, "1000")

      let tx = await xAllocationVoting.proposeNewAllocationRound("First allocation round")
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")
      // Event should be emitted
      let allocationProposalCreated = filterEventsByName(receipt.logs, "AllocationProposalCreated")
      let { proposalId } = parseAlloctionProposalCreatedEvent(allocationProposalCreated[0], xAllocationVoting)

      await waitForProposalToBeActive(proposalId, xAllocationVoting)

      // I should be able to cast a vote
      tx = await xAllocationVoting.connect(otherAccount).castVote(proposalId, [app1], [ethers.parseEther("500")])
      receipt = await tx.wait()

      // I cannot cast a vote twice for the same proposal
      await catchRevert(
        xAllocationVoting.connect(otherAccount).castVote(proposalId, [app1], [ethers.parseEther("500")]),
      )
    })

    it("Cannot cast a vote if the allocation round ended", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, xAllocationPool, owner } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })
      await xAllocationPool.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, true)
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      await getVot3Tokens(otherAccount, "1000")

      let tx = await xAllocationVoting.proposeNewAllocationRound("First allocation round")
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")
      // Event should be emitted
      let allocationProposalCreated = filterEventsByName(receipt.logs, "AllocationProposalCreated")
      let { proposalId } = parseAlloctionProposalCreatedEvent(allocationProposalCreated[0], xAllocationVoting)

      await waitForProposalToBeActive(proposalId, xAllocationVoting)

      // I should be able to cast a vote
      tx = await xAllocationVoting.connect(otherAccount).castVote(proposalId, [app1], [ethers.parseEther("500")])
      receipt = await tx.wait()

      await waitForVotingPeriodToEnd(proposalId, xAllocationVoting)

      // I cannot cast a vote if the proposal is not active
      await catchRevert(
        xAllocationVoting.connect(otherAccount).castVote(proposalId, [app1], [ethers.parseEther("500")]),
      )
    })

    it("I should be able to vote for multiple apps", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, xAllocationPool, owner } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })
      await xAllocationPool.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, true)
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await xAllocationPool.connect(owner).addApp(otherAccounts[1].address, otherAccounts[1].address, true)
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))

      await getVot3Tokens(otherAccount, "1000")

      let tx = await xAllocationVoting.proposeNewAllocationRound("Second allocation round")
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let allocationProposalCreated = filterEventsByName(receipt.logs, "AllocationProposalCreated")
      expect(allocationProposalCreated).not.to.eql([])
      let { proposalId } = parseAlloctionProposalCreatedEvent(allocationProposalCreated[0], xAllocationVoting)

      // I should be able to vote for multiple apps
      tx = await xAllocationVoting
        .connect(otherAccount)
        .castVote(proposalId, [app1, app2], [ethers.parseEther("300"), ethers.parseEther("200")])
      receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let allocationVoteCast = filterEventsByName(receipt.logs, "AllocationVoteCast")
      expect(allocationProposalCreated).not.to.eql([])
      let {
        voter,
        apps: votedApps,
        voteWeights,
        proposalId: votedProposalId,
      } = parseAllocationVoteCastEvent(allocationVoteCast[0], xAllocationVoting)
      expect(voter).to.eql(otherAccount.address)
      expect(votedProposalId).to.eql(proposalId)
      expect(votedApps).to.eql([app1, app2])
      expect(voteWeights).to.eql([ethers.parseEther("300"), ethers.parseEther("200")])

      // Votes should be tracked correctly
      let appVotes = await xAllocationVoting.getAppVotes(proposalId, app1)
      expect(appVotes).to.eql(ethers.parseEther("300"))
      appVotes = await xAllocationVoting.getAppVotes(proposalId, app2)
      expect(appVotes).to.eql(ethers.parseEther("200"))

      let totalVotes = await xAllocationVoting.getAllocationRoundTotalVotes(proposalId)
      expect(totalVotes).to.eql(ethers.parseEther("500"))
    })

    it("Votes should be tracked correctly", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, xAllocationPool, owner } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      await xAllocationPool.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, true)
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await xAllocationPool.connect(owner).addApp(otherAccounts[1].address, otherAccounts[1].address, true)
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
      const voter2 = otherAccounts[3]
      const voter3 = otherAccounts[4]

      await getVot3Tokens(otherAccount, "1000")
      await getVot3Tokens(voter2, "1000")
      await getVot3Tokens(voter3, "1000")

      let tx = await xAllocationVoting.proposeNewAllocationRound("Second allocation round")
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let allocationProposalCreated = filterEventsByName(receipt.logs, "AllocationProposalCreated")
      expect(allocationProposalCreated).not.to.eql([])
      let { proposalId } = parseAlloctionProposalCreatedEvent(allocationProposalCreated[0], xAllocationVoting)

      tx = await xAllocationVoting
        .connect(otherAccount)
        .castVote(proposalId, [app1, app2], [ethers.parseEther("300"), ethers.parseEther("200")])
      receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      tx = await xAllocationVoting
        .connect(voter2)
        .castVote(proposalId, [app1, app2], [ethers.parseEther("200"), ethers.parseEther("100")])
      receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      tx = await xAllocationVoting
        .connect(voter3)
        .castVote(proposalId, [app1, app2], [ethers.parseEther("100"), ethers.parseEther("500")])
      receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      // Votes should be tracked correctly
      let appVotes = await xAllocationVoting.getAppVotes(proposalId, app1)
      expect(appVotes).to.eql(ethers.parseEther("600"))
      appVotes = await xAllocationVoting.getAppVotes(proposalId, app2)
      expect(appVotes).to.eql(ethers.parseEther("800"))

      let totalVotes = await xAllocationVoting.getAllocationRoundTotalVotes(proposalId)
      expect(totalVotes).to.eql(ethers.parseEther("1400"))

      await waitForVotingPeriodToEnd(proposalId, xAllocationVoting)

      // Votes should be the same after round ended
      appVotes = await xAllocationVoting.getAppVotes(proposalId, app1)
      expect(appVotes).to.eql(ethers.parseEther("600"))
      appVotes = await xAllocationVoting.getAppVotes(proposalId, app2)
      expect(appVotes).to.eql(ethers.parseEther("800"))

      totalVotes = await xAllocationVoting.getAllocationRoundTotalVotes(proposalId)
      expect(totalVotes).to.eql(ethers.parseEther("1400"))
    })

    it("I should be able to vote only for apps available in the allocation round", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, xAllocationPool, owner } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      await xAllocationPool.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, true)
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await xAllocationPool.connect(owner).addApp(otherAccounts[1].address, otherAccounts[1].address, true)
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
      const app3 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))

      await getVot3Tokens(otherAccount, "1000")

      let tx = await xAllocationVoting.proposeNewAllocationRound("Second allocation round")
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let allocationProposalCreated = filterEventsByName(receipt.logs, "AllocationProposalCreated")
      expect(allocationProposalCreated).not.to.eql([])
      let { proposalId } = parseAlloctionProposalCreatedEvent(allocationProposalCreated[0], xAllocationVoting)

      // I should be able to vote for multiple apps
      await catchRevert(
        xAllocationVoting.connect(otherAccount).castVote(proposalId, [app3], [ethers.parseEther("300")]),
      )

      // Votes should be tracked correctly
      let appVotes = await xAllocationVoting.getAppVotes(proposalId, app1)
      expect(appVotes).to.eql(ethers.parseEther("0"))
      appVotes = await xAllocationVoting.getAppVotes(proposalId, app2)
      expect(appVotes).to.eql(ethers.parseEther("0"))
      appVotes = await xAllocationVoting.getAppVotes(proposalId, app3)
      expect(appVotes).to.eql(ethers.parseEther("0"))

      let totalVotes = await xAllocationVoting.getAllocationRoundTotalVotes(proposalId)
      expect(totalVotes).to.eql(ethers.parseEther("0"))
    })
  })
})
