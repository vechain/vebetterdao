import { ethers } from "hardhat"
import { expect } from "chai"
import {
  catchRevert,
  createProposalAndExecuteIt,
  filterEventsByName,
  getOrDeployContractInstances,
  getVot3Tokens,
  moveToCycle,
  parseAllocationVoteCastEvent,
  parseRoundStartedEvent,
  parseAppAddedEvent,
  startNewAllocationRound,
  waitForRoundToEnd,
  bootstrapEmissions,
} from "./helpers"
import { describe, it } from "mocha"

describe("X-Allocation Voting", function () {
  describe("Deployment", function () {
    it("Admins and addresses should be set correctly", async function () {
      const { xAllocationVoting, owner, timeLock } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      const ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000"

      expect(await xAllocationVoting.hasRole(ADMIN_ROLE, await timeLock.getAddress())).to.eql(true)
      expect(await xAllocationVoting.hasRole(ADMIN_ROLE, owner.address)).to.eql(true)

      expect(await xAllocationVoting.b3trGovernor()).to.eql(await timeLock.getAddress())
    })
  })

  describe("Settings", function () {
    it("Should be able to change B3trGovernanceAddress with admin role", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: false,
      })
      const ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000"

      const initialAddress = await xAllocationVoting.b3trGovernor()
      expect(initialAddress).to.exist

      expect(await xAllocationVoting.hasRole(ADMIN_ROLE, owner.address)).to.eql(true)

      await xAllocationVoting.connect(owner).setB3trGovernanceAddress(otherAccounts[3].address)

      const updatedAddress = await xAllocationVoting.b3trGovernor()
      expect(updatedAddress).to.eql(otherAccounts[3].address)
    })

    it("Only admin should be able to change B3trGovernanceAddress", async function () {
      const { xAllocationVoting, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: false,
      })
      const ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000"

      const initialAddress = await xAllocationVoting.b3trGovernor()
      expect(initialAddress).to.exist

      expect(await xAllocationVoting.hasRole(ADMIN_ROLE, otherAccounts[0].address)).to.eql(false)

      await catchRevert(xAllocationVoting.connect(otherAccounts[0]).setB3trGovernanceAddress(otherAccounts[3].address))

      const updatedAddress = await xAllocationVoting.b3trGovernor()
      expect(updatedAddress).to.eql(initialAddress)
    })

    it("Contract should not be able to receive ether", async function () {
      const { xAllocationVoting, owner } = await getOrDeployContractInstances({ forceDeploy: false })

      expect(
        owner.sendTransaction({
          to: await xAllocationVoting.getAddress(),
          value: ethers.parseEther("1.0"), // Sends exactly 1.0 ether
        }),
      ).to.be.reverted

      expect(await ethers.provider.getBalance(await xAllocationVoting.getAddress())).to.eql(0n)
    })
  })

  describe("X-Apps", function () {
    it("Should be able to add an app successfully", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      let tx = await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let appAdded = filterEventsByName(receipt.logs, "AppAdded")
      expect(appAdded).not.to.eql([])

      let { id, address } = parseAppAddedEvent(appAdded[0], xAllocationVoting)
      expect(id).to.eql(app1Id)
      expect(address).to.eql(otherAccounts[0].address)
    })

    it("Should not be able to add an app if it is already added", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")

      await catchRevert(xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, ""))
    })

    it("Only admin address should be able to add an app", async function () {
      const { xAllocationVoting, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: true })

      await catchRevert(
        xAllocationVoting.connect(otherAccounts[0]).addApp(otherAccounts[0].address, otherAccounts[0].address, ""),
      )
    })

    it("Should be possible to add a new app through the DAO", async function () {
      const { xAllocationVoting, otherAccounts, governor } = await getOrDeployContractInstances({ forceDeploy: true })

      const proposer = otherAccounts[0]
      const voter1 = otherAccounts[1]
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("Bike 4 Life"))

      // check that app does not exists
      await expect(xAllocationVoting.getApp(app1Id)).to.be.reverted

      await createProposalAndExecuteIt(
        proposer,
        voter1,
        governor,
        xAllocationVoting,
        await ethers.getContractFactory("XAllocationVoting"),
        "Add app to the list",
        "addApp",
        [otherAccounts[1].address, "Bike 4 Life", ""],
      )

      // check that app was added
      const app = await xAllocationVoting.getApp(app1Id)
      expect(app[0]).to.eql(app1Id)
      expect(app[1]).to.eql(otherAccounts[1].address)
      expect(app[2]).to.eql("Bike 4 Life")
      expect(app[3]).to.eql("")
    }).timeout(18000000)

    it("Should be able to fetch app receiver address", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      await xAllocationVoting.connect(owner).addApp(otherAccounts[2].address, "My app", "")
      await xAllocationVoting.connect(owner).addApp(otherAccounts[3].address, "My app #2", "")

      const app1ReceiverAddress = await xAllocationVoting.getAppReceiverAddress(app1Id)
      const app2ReceiverAddress = await xAllocationVoting.getAppReceiverAddress(app2Id)
      expect(app1ReceiverAddress).to.eql(otherAccounts[2].address)
      expect(app2ReceiverAddress).to.eql(otherAccounts[3].address)
    })
  })

  describe("Allocation rounds", function () {
    it("Should be able to start a new allocation round successfully", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")

      let tx = await xAllocationVoting.connect(owner).startNewRound()
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      // Event should be emitted
      let roundCreated = filterEventsByName(receipt.logs, "RoundCreated")
      expect(roundCreated).not.to.eql([])

      let { roundId } = parseRoundStartedEvent(roundCreated[0], xAllocationVoting)
      expect(roundId).to.eql(BigInt(1))

      //Proposal should be active
      let roundState = await xAllocationVoting.state(roundId)
      expect(roundState).to.eql(BigInt(0))
    })

    it("Should not be able to start a new allocation round if there is an active one", async function () {
      const { xAllocationVoting, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await getVot3Tokens(otherAccount, "1000")

      let tx = await xAllocationVoting.connect(owner).startNewRound()
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      // Event should be emitted
      let roundCreated = filterEventsByName(receipt.logs, "RoundCreated")
      expect(roundCreated).not.to.eql([])

      let { roundId } = parseRoundStartedEvent(roundCreated[0], xAllocationVoting)

      // Proposal should be active
      let roundState = await xAllocationVoting.state(roundId)
      expect(roundState).to.eql(BigInt(0))

      // should not be able to start a new allocation round if there is an active one
      await catchRevert(xAllocationVoting.connect(owner).startNewRound())

      // should not be able to start a new allocation round if there is an active one
      await catchRevert(xAllocationVoting.connect(owner).startNewRound())
    })

    it("Should be able to start a new allocation round if the previous one ended", async function () {
      const { xAllocationVoting, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await getVot3Tokens(otherAccount, "1000")

      let tx = await xAllocationVoting.connect(owner).startNewRound()
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      // Event should be emitted
      let roundCreated = filterEventsByName(receipt.logs, "RoundCreated")
      let { roundId } = parseRoundStartedEvent(roundCreated[0], xAllocationVoting)
      expect(roundId).to.eql(BigInt(1))

      await waitForRoundToEnd(roundId, xAllocationVoting)

      // should not be able to start a new allocation round if there is an active one
      tx = await xAllocationVoting.connect(owner).startNewRound()
      receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      roundCreated = filterEventsByName(receipt.logs, "RoundCreated")
      expect(roundCreated).not.to.eql([])
      ;({ roundId } = parseRoundStartedEvent(roundCreated[0], xAllocationVoting))

      expect(roundId).to.eql(BigInt(2))

      const currentRoundId = await xAllocationVoting.currentRoundId()
      expect(currentRoundId).to.eql(BigInt(2))
    }).timeout(18000000)

    it("New round is started each time an emission occurs", async function () {
      const { xAllocationVoting, owner, b3tr, emissions, minterAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      //no round at start
      let round = parseInt((await xAllocationVoting.currentRoundId()).toString())
      expect(round).to.eql(0)

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await emissions.connect(minterAccount).start()

      // round should be created
      round = parseInt((await xAllocationVoting.currentRoundId()).toString())
      expect(round).to.eql(1)

      // should be active
      let state = await xAllocationVoting.state(round)
      expect(state).to.eql(0n)

      // distribute second emission (should start also new round)
      await moveToCycle(emissions, minterAccount, 3)

      // first round should be ended and successfull (total supply is 0)
      state = await xAllocationVoting.state(round)
      expect(state).to.eql(2n)

      // round should be created
      round = parseInt((await xAllocationVoting.currentRoundId()).toString())
      expect(round).to.eql(2)
    })
  })

  describe("App availability for allocation voting", function () {
    it("Should be possible to add an app and make it available for allocation voting", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const app1Id = await xAllocationVoting.hashName(otherAccounts[0].address)

      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")

      let roundId = await startNewAllocationRound(xAllocationVoting)

      const isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, roundId)
      expect(isEligibleForVote).to.eql(true)
    })

    it("Admin can make an app unavailable for allocation voting starting from next round", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const app1Id = await xAllocationVoting.hashName(otherAccounts[0].address)
      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")

      let round1 = await startNewAllocationRound(xAllocationVoting)

      await xAllocationVoting.connect(owner).setVotingElegibility(app1Id, false)

      // app should still be eligible for the current round
      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      let appsVotedInSpecificRound = await xAllocationVoting.getRoundApps(round1)
      expect(appsVotedInSpecificRound.length).to.equal(1n)

      await waitForRoundToEnd(round1, xAllocationVoting)
      let round2 = await startNewAllocationRound(xAllocationVoting)

      // app should not be elegible from this round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round2)
      expect(isEligibleForVote).to.eql(false)

      appsVotedInSpecificRound = await xAllocationVoting.getRoundApps(round2)
      expect(appsVotedInSpecificRound.length).to.equal(0)

      // if checking for the previous round, it should still be eligible
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)
    })

    it("DAO can make an app unavailable for allocation voting starting from next round", async function () {
      const { otherAccounts, governor, xAllocationVoting } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const app1Id = await xAllocationVoting.hashName("Bike 4 Life")
      const proposer = otherAccounts[0]
      const voter1 = otherAccounts[1]

      // check that app does not exists
      await expect(xAllocationVoting.getApp(app1Id)).to.be.reverted

      await createProposalAndExecuteIt(
        proposer,
        voter1,
        governor,
        xAllocationVoting,
        await ethers.getContractFactory("XAllocationVoting"),
        "Add app to the list",
        "addApp",
        [otherAccounts[0].address, "Bike 4 Life", ""],
      )

      let round1 = await startNewAllocationRound(xAllocationVoting)

      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      await createProposalAndExecuteIt(
        proposer,
        voter1,
        governor,
        xAllocationVoting,
        await ethers.getContractFactory("XAllocationVoting"),
        "Exclude app from the allocation voting rounds",
        "setVotingElegibility",
        [app1Id, false],
      )

      // app should still be eligible for the current round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      await waitForRoundToEnd(round1, xAllocationVoting)
      let round2 = await startNewAllocationRound(xAllocationVoting)

      // app should not be elegible from this round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round2)
      expect(isEligibleForVote).to.eql(false)
    })

    it("Non-admin address cannot make an app available or unavailable for allocation voting", async function () {
      const { xAllocationVoting, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: false })

      const app1Id = await xAllocationVoting.hashName(otherAccounts[0].address)

      await catchRevert(xAllocationVoting.connect(otherAccounts[0]).setVotingElegibility(app1Id, true))
    })

    it("App needs to wait next round if added during an ongoing round", async function () {
      const { otherAccounts, owner, xAllocationVoting, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      const voter = otherAccounts[0]
      await getVot3Tokens(voter, "1000")

      const app1Id = await xAllocationVoting.hashName(otherAccounts[0].address)

      let round1 = await startNewAllocationRound(xAllocationVoting)

      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")
      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(false)

      //check that I cannot vote for this app in current round
      await catchRevert(xAllocationVoting.connect(voter).castVote(round1, [app1Id], [ethers.parseEther("1")]))

      let appVotes = await xAllocationVoting.getAppVotes(round1, app1Id)
      expect(appVotes).to.equal(0n)

      let appsVotedInSpecificRound = await xAllocationVoting.getRoundApps(round1)
      expect(appsVotedInSpecificRound.length).to.equal(0)

      await waitForRoundToEnd(round1, xAllocationVoting)
      let round2 = await startNewAllocationRound(xAllocationVoting)

      // app should not be elegible from this round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round2)
      expect(isEligibleForVote).to.eql(true)

      // check that I can vote for this app
      expect(await xAllocationVoting.connect(voter).castVote(round2, [app1Id], [ethers.parseEther("1")])).to.not.be
        .reverted

      appVotes = await xAllocationVoting.getAppVotes(round2, app1Id)
      expect(appVotes).to.equal(ethers.parseEther("1"))
    })
  })

  describe("Allocation Voting", function () {
    it("I cannot cast a vote with higher balance than I have", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, owner, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      await getVot3Tokens(otherAccount, "1000")

      let tx = await xAllocationVoting.startNewRound()
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")
      // Event should be emitted
      let roundCreated = filterEventsByName(receipt.logs, "RoundCreated")
      let { roundId } = parseRoundStartedEvent(roundCreated[0], xAllocationVoting)

      // I cannot cast a vote with higher balance than I have
      await catchRevert(xAllocationVoting.connect(otherAccount).castVote(roundId, [app1], [ethers.parseEther("1500")]))
    })

    it("I should be able to cast a vote", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, owner, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      await getVot3Tokens(otherAccount, "1000")

      let tx = await xAllocationVoting.startNewRound()
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")
      // Event should be emitted
      let roundCreated = filterEventsByName(receipt.logs, "RoundCreated")
      let { roundId } = parseRoundStartedEvent(roundCreated[0], xAllocationVoting)

      // I should be able to cast a vote
      tx = await xAllocationVoting.connect(otherAccount).castVote(roundId, [app1], [ethers.parseEther("500")])
      receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let allocationVoteCast = filterEventsByName(receipt.logs, "AllocationVoteCast")
      expect(roundCreated).not.to.eql([])

      let {
        voter,
        apps: votedApps,
        voteWeights,
        roundId: votedRoundId,
      } = parseAllocationVoteCastEvent(allocationVoteCast[0], xAllocationVoting)
      expect(voter).to.eql(otherAccount.address)
      expect(votedRoundId).to.eql(roundId)
      expect(votedApps).to.eql([app1])
      expect(voteWeights).to.eql([ethers.parseEther("500")])

      // Votes should be tracked correctly
      let appVotes = await xAllocationVoting.getAppVotes(roundId, app1)
      expect(appVotes).to.eql(ethers.parseEther("500"))

      let totalVotes = await xAllocationVoting.totalVotes(roundId)
      expect(totalVotes).to.eql(ethers.parseEther("500"))
    })

    it("I should not be able to cast vote twice", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, owner, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })
      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      await getVot3Tokens(otherAccount, "1000")

      let tx = await xAllocationVoting.startNewRound()
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")
      // Event should be emitted
      let roundCreated = filterEventsByName(receipt.logs, "RoundCreated")
      let { roundId } = parseRoundStartedEvent(roundCreated[0], xAllocationVoting)

      // I should be able to cast a vote
      tx = await xAllocationVoting.connect(otherAccount).castVote(roundId, [app1], [ethers.parseEther("500")])
      receipt = await tx.wait()

      // I cannot cast a vote twice for the same round
      await catchRevert(xAllocationVoting.connect(otherAccount).castVote(roundId, [app1], [ethers.parseEther("500")]))
    })

    it("Cannot cast a vote if the allocation round ended", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, owner, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      await getVot3Tokens(otherAccount, "1000")

      let tx = await xAllocationVoting.startNewRound()
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")
      // Event should be emitted
      let roundCreated = filterEventsByName(receipt.logs, "RoundCreated")
      let { roundId } = parseRoundStartedEvent(roundCreated[0], xAllocationVoting)

      // I should be able to cast a vote
      tx = await xAllocationVoting.connect(otherAccount).castVote(roundId, [app1], [ethers.parseEther("500")])
      receipt = await tx.wait()

      await waitForRoundToEnd(roundId, xAllocationVoting)

      // I cannot cast a vote if the round is not active
      await catchRevert(xAllocationVoting.connect(otherAccount).castVote(roundId, [app1], [ethers.parseEther("500")]))
    })

    it("I should be able to vote for multiple apps", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, owner, minterAccount, b3tr, emissions } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })
      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await xAllocationVoting.connect(owner).addApp(otherAccounts[1].address, otherAccounts[1].address, "")
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))

      await getVot3Tokens(otherAccount, "1000")

      let tx = await xAllocationVoting.startNewRound()
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let roundCreated = filterEventsByName(receipt.logs, "RoundCreated")
      expect(roundCreated).not.to.eql([])
      let { roundId } = parseRoundStartedEvent(roundCreated[0], xAllocationVoting)

      // both apps should be elegible for votes
      const app1Available = await xAllocationVoting.isEligibleForVote(app1, roundId)
      const app2Available = await xAllocationVoting.isEligibleForVote(app1, roundId)
      expect(app1Available).to.equal(true)
      expect(app2Available).to.equal(true)

      const avaiableApps = await xAllocationVoting.allElegibleApps()
      expect(avaiableApps.length).to.equal(2)
      expect(avaiableApps[0]).to.equal(app1)
      expect(avaiableApps[1]).to.equal(app2)

      let appsVotedInSpecificRound = await xAllocationVoting.getRoundApps(roundId)
      expect(appsVotedInSpecificRound.length).to.equal(2)
      expect(appsVotedInSpecificRound[0]).to.equal(app1)
      expect(appsVotedInSpecificRound[1]).to.equal(app2)

      // I should be able to vote for multiple apps
      tx = await xAllocationVoting
        .connect(otherAccount)
        .castVote(roundId, [app1, app2], [ethers.parseEther("300"), ethers.parseEther("200")])
      receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let allocationVoteCast = filterEventsByName(receipt.logs, "AllocationVoteCast")
      expect(roundCreated).not.to.eql([])
      let {
        voter,
        apps: votedApps,
        voteWeights,
        roundId: votedRoundId,
      } = parseAllocationVoteCastEvent(allocationVoteCast[0], xAllocationVoting)
      expect(voter).to.eql(otherAccount.address)
      expect(votedRoundId).to.eql(roundId)
      expect(votedApps).to.eql([app1, app2])
      expect(voteWeights).to.eql([ethers.parseEther("300"), ethers.parseEther("200")])

      // Votes should be tracked correctly
      let appVotes = await xAllocationVoting.getAppVotes(roundId, app1)
      expect(appVotes).to.eql(ethers.parseEther("300"))
      appVotes = await xAllocationVoting.getAppVotes(roundId, app2)
      expect(appVotes).to.eql(ethers.parseEther("200"))

      let totalVotes = await xAllocationVoting.totalVotes(roundId)
      expect(totalVotes).to.eql(ethers.parseEther("500"))
    })

    it("Votes should be tracked correctly", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, owner, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await xAllocationVoting.connect(owner).addApp(otherAccounts[1].address, otherAccounts[1].address, "")
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
      const voter2 = otherAccounts[3]
      const voter3 = otherAccounts[4]

      await getVot3Tokens(otherAccount, "1000")
      await getVot3Tokens(voter2, "1000")
      await getVot3Tokens(voter3, "1000")

      let tx = await xAllocationVoting.startNewRound()
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let roundCreated = filterEventsByName(receipt.logs, "RoundCreated")
      expect(roundCreated).not.to.eql([])
      let { roundId } = parseRoundStartedEvent(roundCreated[0], xAllocationVoting)

      tx = await xAllocationVoting
        .connect(otherAccount)
        .castVote(roundId, [app1, app2], [ethers.parseEther("300"), ethers.parseEther("200")])
      receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      tx = await xAllocationVoting
        .connect(voter2)
        .castVote(roundId, [app1, app2], [ethers.parseEther("200"), ethers.parseEther("100")])
      receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      tx = await xAllocationVoting
        .connect(voter3)
        .castVote(roundId, [app1, app2], [ethers.parseEther("100"), ethers.parseEther("500")])
      receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      // Votes should be tracked correctly
      let appVotes = await xAllocationVoting.getAppVotes(roundId, app1)
      expect(appVotes).to.eql(ethers.parseEther("600"))
      appVotes = await xAllocationVoting.getAppVotes(roundId, app2)
      expect(appVotes).to.eql(ethers.parseEther("800"))

      let totalVotes = await xAllocationVoting.totalVotes(roundId)
      expect(totalVotes).to.eql(ethers.parseEther("1400"))

      // Total voters should be tracked correctly
      let totalVoters = await xAllocationVoting.totalVoters(roundId)
      expect(totalVoters).to.eql(BigInt(3))

      await waitForRoundToEnd(roundId, xAllocationVoting)

      // Votes should be the same after round ended
      appVotes = await xAllocationVoting.getAppVotes(roundId, app1)
      expect(appVotes).to.eql(ethers.parseEther("600"))
      appVotes = await xAllocationVoting.getAppVotes(roundId, app2)
      expect(appVotes).to.eql(ethers.parseEther("800"))

      totalVotes = await xAllocationVoting.totalVotes(roundId)
      expect(totalVotes).to.eql(ethers.parseEther("1400"))
    })

    it("I should be able to vote only for apps available in the allocation round", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, owner, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await xAllocationVoting.connect(owner).addApp(otherAccounts[1].address, otherAccounts[1].address, "")
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
      const app3 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))

      await getVot3Tokens(otherAccount, "1000")

      let tx = await xAllocationVoting.startNewRound()
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let roundCreated = filterEventsByName(receipt.logs, "RoundCreated")
      expect(roundCreated).not.to.eql([])
      let { roundId } = parseRoundStartedEvent(roundCreated[0], xAllocationVoting)

      await catchRevert(xAllocationVoting.connect(otherAccount).castVote(roundId, [app3], [ethers.parseEther("300")]))

      // Votes should be tracked correctly
      let appVotes = await xAllocationVoting.getAppVotes(roundId, app1)
      expect(appVotes).to.eql(ethers.parseEther("0"))
      appVotes = await xAllocationVoting.getAppVotes(roundId, app2)
      expect(appVotes).to.eql(ethers.parseEther("0"))
      appVotes = await xAllocationVoting.getAppVotes(roundId, app3)
      expect(appVotes).to.eql(ethers.parseEther("0"))

      let totalVotes = await xAllocationVoting.totalVotes(roundId)
      expect(totalVotes).to.eql(ethers.parseEther("0"))
    })

    it("Allocation round should be successfull if quorum was reached", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, owner, vot3, b3tr, minterAccount, emissions } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await xAllocationVoting.connect(owner).addApp(otherAccounts[1].address, otherAccounts[1].address, "")
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))

      await getVot3Tokens(otherAccount, "1000")

      let tx = await xAllocationVoting.startNewRound()
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      const timepoint = receipt.blockNumber

      let roundCreated = filterEventsByName(receipt.logs, "RoundCreated")
      expect(roundCreated).not.to.eql([])
      let { roundId } = parseRoundStartedEvent(roundCreated[0], xAllocationVoting)

      tx = await xAllocationVoting
        .connect(otherAccount)
        .castVote(roundId, [app1, app2], [ethers.parseEther("300"), ethers.parseEther("200")])
      receipt = await tx.wait()

      await waitForRoundToEnd(roundId, xAllocationVoting)

      // Check totalSupply
      const totalSupply = await vot3.getPastTotalSupply(timepoint)
      // Check quorum
      const quorum = await xAllocationVoting.quorum(timepoint)
      // calculate how much is needed to reach quorum from total supply
      const neededVotes = (Number(ethers.formatEther(quorum)) * Number(ethers.formatEther(totalSupply))) / 100
      expect(500).to.be.greaterThan(neededVotes)

      // quorum should be reached and round should be successful
      expect(await xAllocationVoting.state(roundId)).to.eql(BigInt(2))
    }).timeout(18000000)

    it("Allocation round should be failed if quorum was not reached", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, owner, vot3, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await xAllocationVoting.connect(owner).addApp(otherAccounts[1].address, otherAccounts[1].address, "")
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))

      await getVot3Tokens(otherAccount, "1000")

      let tx = await xAllocationVoting.startNewRound()
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")
      const timepoint = receipt.blockNumber

      let roundCreated = filterEventsByName(receipt.logs, "RoundCreated")
      expect(roundCreated).not.to.eql([])
      let { roundId } = parseRoundStartedEvent(roundCreated[0], xAllocationVoting)

      tx = await xAllocationVoting
        .connect(otherAccount)
        .castVote(roundId, [app1, app2], [ethers.parseEther("1"), ethers.parseEther("1")])
      receipt = await tx.wait()

      await waitForRoundToEnd(roundId, xAllocationVoting)

      // Check totalSupply
      const totalSupply = await vot3.getPastTotalSupply(timepoint)
      // Check quorum
      const quorum = await xAllocationVoting.quorum(timepoint)
      // calculate how much is needed to reach quorum from total supply
      const neededVotes = (Number(ethers.formatEther(quorum)) * Number(ethers.formatEther(totalSupply))) / 100
      expect(neededVotes).to.be.greaterThan(2)

      expect(await xAllocationVoting.state(roundId)).to.eql(BigInt(1))
    }).timeout(18000000)

    it("Can track apps available for voting on current and previous rounds correctly", async function () {
      const { xAllocationVoting, otherAccounts, owner, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // 2 apps in round1
      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await xAllocationVoting.connect(owner).addApp(otherAccounts[1].address, otherAccounts[1].address, "")
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
      let round1 = await startNewAllocationRound(xAllocationVoting)
      let getRoundApps = await xAllocationVoting.getRoundApps(round1)
      expect(getRoundApps.length).to.equal(2n)

      // add new app before round ends
      await xAllocationVoting.connect(owner).addApp(otherAccounts[2].address, otherAccounts[2].address, "")
      await xAllocationVoting.connect(owner).addApp(otherAccounts[3].address, otherAccounts[3].address, "")
      await waitForRoundToEnd(round1, xAllocationVoting)

      // 4 apps in round2
      let round2 = await startNewAllocationRound(xAllocationVoting)
      getRoundApps = await xAllocationVoting.getRoundApps(round2)
      expect(getRoundApps.length).to.equal(4n)

      // remove apps before round ends
      await xAllocationVoting.setVotingElegibility(app1, false)
      await xAllocationVoting.setVotingElegibility(app2, false)
      await waitForRoundToEnd(round2, xAllocationVoting)

      // 2 app in round 3
      let round3 = await startNewAllocationRound(xAllocationVoting)
      getRoundApps = await xAllocationVoting.getRoundApps(round3)
      expect(getRoundApps.length).to.equal(2n)

      // add another app before round ends
      await xAllocationVoting.connect(owner).addApp(otherAccounts[4].address, otherAccounts[4].address, "")
      await waitForRoundToEnd(round3, xAllocationVoting)

      // 3 apps in round 4
      let round4 = await startNewAllocationRound(xAllocationVoting)
      getRoundApps = await xAllocationVoting.getRoundApps(round4)
      expect(getRoundApps.length).to.equal(3n)

      // I can still get old rounds
      getRoundApps = await xAllocationVoting.getRoundApps(round1)
      expect(getRoundApps.length).to.equal(2n)
      getRoundApps = await xAllocationVoting.getRoundApps(round2)
      expect(getRoundApps.length).to.equal(4n)
      getRoundApps = await xAllocationVoting.getRoundApps(round3)
      expect(getRoundApps.length).to.equal(2n)
    })

    it("I can fetch all apps with details available for voting", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // 2 apps in round1
      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address, "")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await xAllocationVoting.connect(owner).addApp(otherAccounts[1].address, otherAccounts[1].address, "")
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
      let round1 = await startNewAllocationRound(xAllocationVoting)
      let getRoundApps = await xAllocationVoting.getRoundApps(round1)
      expect(getRoundApps.length).to.equal(2n)

      let apps = await xAllocationVoting.getRoundAppsWithDetails(round1)
      expect(apps.length).to.equal(2n)
      expect(apps[0].id).to.equal(app1)
      expect(apps[1].id).to.equal(app2)
      expect(apps[0].name).to.equal(otherAccounts[0].address)
      expect(apps[1].name).to.equal(otherAccounts[1].address)
      expect(apps[0].metadata).to.equal("")
      expect(apps[1].metadata).to.equal("")
    })

    it("Stores that a user voted at least once", async function () {
      const { xAllocationVoting, otherAccount, owner, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // Check if user voted
      let voted = await xAllocationVoting.hasVotedOnce(otherAccount.address)
      expect(voted).to.equal(false)

      await getVot3Tokens(otherAccount, "1")
      await getVot3Tokens(owner, "1000")

      const appName = "App"

      await xAllocationVoting.connect(owner).addApp(otherAccount.address, appName, "")
      const roundId = await startNewAllocationRound(xAllocationVoting)

      // Vote
      await xAllocationVoting
        .connect(otherAccount)
        .castVote(roundId, [await xAllocationVoting.hashName(appName)], [ethers.parseEther("1")])

      // Check if user voted
      voted = await xAllocationVoting.hasVotedOnce(otherAccount.address)
      expect(voted).to.equal(true)
    })
  })

  describe("Allocation Voting finalization", function () {
    it("Previous round is finalized correctly when a new one starts", async function () {
      const { xAllocationVoting } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      let round1 = await startNewAllocationRound(xAllocationVoting)
      await waitForRoundToEnd(round1, xAllocationVoting)

      let isFinalized = await xAllocationVoting.isFinalized(round1)
      expect(isFinalized).to.eql(false)

      await startNewAllocationRound(xAllocationVoting)

      isFinalized = await xAllocationVoting.isFinalized(round1)
      expect(isFinalized).to.eql(true)
    })

    it("Anyone can manually trigger round finalization", async function () {
      const { xAllocationVoting, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      await getVot3Tokens(otherAccount, "1000")

      let round1 = await startNewAllocationRound(xAllocationVoting)
      await waitForRoundToEnd(round1, xAllocationVoting)

      // should be failed since quorum is not reached
      let state = await xAllocationVoting.state(round1)
      expect(state).to.eql(1n)

      let isFinalized = await xAllocationVoting.isFinalized(round1)
      expect(isFinalized).to.eql(false)

      await xAllocationVoting.finalize(round1)

      isFinalized = await xAllocationVoting.isFinalized(round1)
      expect(isFinalized).to.eql(true)
    })

    it("Cannot finalize active round", async function () {
      const { xAllocationVoting } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      let round1 = await startNewAllocationRound(xAllocationVoting)

      await catchRevert(xAllocationVoting.finalize(round1))

      let isFinalized = await xAllocationVoting.isFinalized(round1)
      expect(isFinalized).to.eql(false)
    })
  })
})
