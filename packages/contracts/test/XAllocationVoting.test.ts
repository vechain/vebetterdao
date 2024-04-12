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
  startNewAllocationRound,
  waitForRoundToEnd,
  bootstrapEmissions,
  getProposalIdFromTx,
  waitForProposalToBeActive,
  waitForVotingPeriodToEnd,
  bootstrapAndStartEmissions,
  waitForCurrentRoundToEnd,
  ZERO_ADDRESS,
} from "./helpers"
import { describe, it } from "mocha"
import { getImplementationAddress } from "@openzeppelin/upgrades-core"

describe("X-Allocation Voting", function () {
  describe("Deployment", function () {
    it("Admins and addresses should be set correctly", async function () {
      const { xAllocationVoting, owner, timeLock, emissions } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      const ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000"

      expect(await xAllocationVoting.hasRole(ADMIN_ROLE, await timeLock.getAddress())).to.eql(true)
      expect(await xAllocationVoting.hasRole(ADMIN_ROLE, owner.address)).to.eql(true)

      expect(await xAllocationVoting.b3trGovernor()).to.eql(await timeLock.getAddress())
      expect(await xAllocationVoting.emissions()).to.eql(await emissions.getAddress())
    })
  })

  describe("Contract upgradeablity", () => {
    it("Admin should be able to upgrade the contract", async function () {
      const { xAllocationVoting, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("XAllocationVoting")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await xAllocationVoting.getAddress())

      const UPGRADER_ROLE = await xAllocationVoting.UPGRADER_ROLE()
      expect(await xAllocationVoting.hasRole(UPGRADER_ROLE, owner.address)).to.eql(true)

      await expect(xAllocationVoting.connect(owner).upgradeToAndCall(await implementation.getAddress(), "0x")).to.not.be
        .reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await xAllocationVoting.getAddress())

      expect(newImplAddress.toUpperCase()).to.not.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.eql((await implementation.getAddress()).toUpperCase())
    })

    it("Only admin should be able to upgrade the contract", async function () {
      const { xAllocationVoting, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("TimeLock")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await xAllocationVoting.getAddress())

      const UPGRADER_ROLE = await xAllocationVoting.UPGRADER_ROLE()
      expect(await xAllocationVoting.hasRole(UPGRADER_ROLE, otherAccount.address)).to.eql(false)

      await expect(xAllocationVoting.connect(otherAccount).upgradeToAndCall(await implementation.getAddress(), "0x")).to
        .be.reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await xAllocationVoting.getAddress())

      expect(newImplAddress.toUpperCase()).to.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.not.eql((await implementation.getAddress()).toUpperCase())
    })

    it("Admin can change UPGRADER_ROLE", async function () {
      const { xAllocationVoting, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("TimeLock")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await xAllocationVoting.getAddress())

      const UPGRADER_ROLE = await xAllocationVoting.UPGRADER_ROLE()
      expect(await xAllocationVoting.hasRole(UPGRADER_ROLE, otherAccount.address)).to.eql(false)

      await expect(xAllocationVoting.connect(owner).grantRole(UPGRADER_ROLE, otherAccount.address)).to.not.be.reverted
      await expect(xAllocationVoting.connect(owner).revokeRole(UPGRADER_ROLE, owner.address)).to.not.be.reverted

      await expect(xAllocationVoting.connect(otherAccount).upgradeToAndCall(await implementation.getAddress(), "0x")).to
        .not.be.reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await xAllocationVoting.getAddress())

      expect(newImplAddress.toUpperCase()).to.not.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.eql((await implementation.getAddress()).toUpperCase())
    })

    it("should be able to upgrade the xAllocationVoting contract through governance", async function () {
      const { xAllocationVoting, timeLock, governor, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await bootstrapAndStartEmissions()
      const votesThreshold = await governor.proposalThreshold()
      await getVot3Tokens(owner, (votesThreshold + BigInt(1)).toString())

      const UPGRADER_ROLE = await xAllocationVoting.UPGRADER_ROLE()
      await expect(xAllocationVoting.connect(owner).grantRole(UPGRADER_ROLE, await timeLock.getAddress())).to.not.be
        .reverted

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("XAllocationVoting")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      // V1 Contract
      const V1Contract = await ethers.getContractAt("XAllocationVoting", await xAllocationVoting.getAddress())

      // Now we can create a proposal
      const encodedFunctionCall = V1Contract.interface.encodeFunctionData("upgradeToAndCall", [
        await implementation.getAddress(),
        "0x",
      ])
      const description = "Upgrading XAllocationVoting contracts"
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description))

      const tx = await governor
        .connect(owner) //@ts-ignore, https://github.com/ethers-io/ethers.js/issues/4296
        .propose([await xAllocationVoting.getAddress()], [0], [encodedFunctionCall], description)

      const proposalId = await getProposalIdFromTx(tx)
      await waitForProposalToBeActive(proposalId)
      await governor.connect(owner).castVote(proposalId, 1)
      await waitForVotingPeriodToEnd(proposalId)
      expect(await governor.state(proposalId)).to.eql(4n) // succeded

      await governor.queue([await xAllocationVoting.getAddress()], [0], [encodedFunctionCall], descriptionHash)
      expect(await governor.state(proposalId)).to.eql(5n)

      await governor.execute([await xAllocationVoting.getAddress()], [0], [encodedFunctionCall], descriptionHash)
      expect(await governor.state(proposalId)).to.eql(7n)

      const newImplAddress = await getImplementationAddress(ethers.provider, await xAllocationVoting.getAddress())
      expect(newImplAddress.toUpperCase()).to.eql((await implementation.getAddress()).toUpperCase())
    })

    it("Cannot initialize twice", async function () {
      const { owner, xAllocationVoting } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await catchRevert(
        xAllocationVoting.initialize({
          vot3Token: owner.address,
          quorumPercentage: 1,
          initialVotingPeriod: 1,
          b3trGovernor: owner.address,
          voterRewards: owner.address,
          emissions: owner.address,
          admins: [owner.address],
          upgrader: owner.address,
          xAppsBaseURI: "ipfs://",
          baseAllocationPercentage: 2,
          appSharesCap: 2,
        }),
      )
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

    it("Cannot set 0x00 address as B3trGovernanceAddress", async function () {
      const { xAllocationVoting, owner } = await getOrDeployContractInstances({ forceDeploy: false })

      await catchRevert(xAllocationVoting.connect(owner).setB3trGovernanceAddress(ZERO_ADDRESS))

      const updatedAddress = await xAllocationVoting.b3trGovernor()

      expect(updatedAddress).to.not.eql(ZERO_ADDRESS)
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

      await expect(
        owner.sendTransaction({
          to: await xAllocationVoting.getAddress(),
          value: ethers.parseEther("1.0"), // Sends exactly 1.0 ether
        }),
      ).to.be.reverted

      expect(await ethers.provider.getBalance(await xAllocationVoting.getAddress())).to.eql(0n)
    })

    it("Can set voting period only through governance", async function () {
      const { xAllocationVoting, owner } = await getOrDeployContractInstances({ forceDeploy: false })
      await expect(xAllocationVoting.connect(owner).setVotingPeriod(10)).to.be.reverted
    })

    it("Can set voting period if less than emissions cycle duration", async function () {
      const { xAllocationVoting, owner, emissions, governor } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      await bootstrapAndStartEmissions()
      const votesThreshold = await governor.proposalThreshold()
      await getVot3Tokens(owner, (votesThreshold + BigInt(1)).toString())
      const cycleDuration = await emissions.cycleDuration()

      // Now we can create a proposal
      const encodedFunctionCall = xAllocationVoting.interface.encodeFunctionData("setVotingPeriod", [
        cycleDuration - 1n,
      ])
      const description = "Updating voting period"
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description))

      const tx = await governor
        .connect(owner) //@ts-ignore, https://github.com/ethers-io/ethers.js/issues/4296
        .propose([await xAllocationVoting.getAddress()], [0], [encodedFunctionCall], description)

      const proposalId = await getProposalIdFromTx(tx)
      await waitForProposalToBeActive(proposalId)
      await governor.connect(owner).castVote(proposalId, 1)
      await waitForVotingPeriodToEnd(proposalId)
      expect(await governor.state(proposalId)).to.eql(4n) // succeded

      await governor.queue([await xAllocationVoting.getAddress()], [0], [encodedFunctionCall], descriptionHash)
      expect(await governor.state(proposalId)).to.eql(5n)

      await governor.execute([await xAllocationVoting.getAddress()], [0], [encodedFunctionCall], descriptionHash)
      expect(await governor.state(proposalId)).to.eql(7n)

      const votingPeriod = await xAllocationVoting.votingPeriod()
      expect(votingPeriod).to.eql(cycleDuration - 1n)
    })

    it("Cannot set voting period if not less than emissions cycle duration", async function () {
      const { xAllocationVoting, owner, emissions, governor } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      await bootstrapAndStartEmissions()
      const votesThreshold = await governor.proposalThreshold()
      await getVot3Tokens(owner, (votesThreshold + BigInt(1)).toString())
      const cycleDuration = await emissions.cycleDuration()
      const beforeVotingPeriod = await xAllocationVoting.votingPeriod()

      // Now we can create a proposal
      const encodedFunctionCall = xAllocationVoting.interface.encodeFunctionData("setVotingPeriod", [cycleDuration])
      const description = "Updating voting period"
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description))

      const tx = await governor
        .connect(owner) //@ts-ignore
        .propose([await xAllocationVoting.getAddress()], [0], [encodedFunctionCall], description)

      const proposalId = await getProposalIdFromTx(tx)
      await waitForProposalToBeActive(proposalId)
      await governor.connect(owner).castVote(proposalId, 1)
      await waitForVotingPeriodToEnd(proposalId)
      expect(await governor.state(proposalId)).to.eql(4n) // succeded

      await governor.queue([await xAllocationVoting.getAddress()], [0], [encodedFunctionCall], descriptionHash)
      expect(await governor.state(proposalId)).to.eql(5n)

      await expect(
        governor.execute([await xAllocationVoting.getAddress()], [0], [encodedFunctionCall], descriptionHash),
      ).to.be.reverted

      const afterVotingPeriod = await xAllocationVoting.votingPeriod()
      expect(afterVotingPeriod).to.eql(beforeVotingPeriod)
    })

    it("Admin can set a new admin", async function () {
      const { xAllocationVoting, owner, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: true })

      const ADMIN_ROLE = await xAllocationVoting.DEFAULT_ADMIN_ROLE()
      expect(await xAllocationVoting.hasRole(ADMIN_ROLE, otherAccounts[0].address)).to.eql(false)
      expect(await xAllocationVoting.hasRole(ADMIN_ROLE, owner.address)).to.eql(true)

      await xAllocationVoting.connect(owner).setAdminRole(otherAccounts[0].address)

      expect(await xAllocationVoting.hasRole(ADMIN_ROLE, otherAccounts[0].address)).to.eql(true)
    })

    it("Admin cannot set zero address as admin", async function () {
      const { xAllocationVoting, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      const ADMIN_ROLE = await xAllocationVoting.DEFAULT_ADMIN_ROLE()
      expect(await xAllocationVoting.hasRole(ADMIN_ROLE, owner.address)).to.eql(true)

      await expect(xAllocationVoting.connect(owner).setAdminRole(ZERO_ADDRESS)).to.be.reverted
    })

    it("Only admin can set a new admin", async function () {
      const { xAllocationVoting, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: true })

      const ADMIN_ROLE = await xAllocationVoting.DEFAULT_ADMIN_ROLE()
      expect(await xAllocationVoting.hasRole(ADMIN_ROLE, otherAccounts[0].address)).to.eql(false)

      await expect(xAllocationVoting.connect(otherAccounts[0]).setAdminRole(otherAccounts[0].address)).to.be.reverted
    })

    it("Admin can change allocation percentage", async function () {
      const { xAllocationVoting, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      const initialPercentage = await xAllocationVoting.baseAllocationPercentage()

      await xAllocationVoting.connect(owner).setBaseAllocationPercentage(3)

      const updatedPercentage = await xAllocationVoting.baseAllocationPercentage()
      expect(updatedPercentage).to.eql(3n)
      expect(updatedPercentage).to.not.eql(initialPercentage)
    })

    it("Only admin can change allocation percentage", async function () {
      const { xAllocationVoting, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: true })

      const initialPercentage = await xAllocationVoting.baseAllocationPercentage()

      await expect(xAllocationVoting.connect(otherAccounts[0]).setBaseAllocationPercentage(3)).to.be.reverted

      const updatedPercentage = await xAllocationVoting.baseAllocationPercentage()
      expect(updatedPercentage).to.eql(initialPercentage)
    })

    it("Admin can change app shares cap", async function () {
      const { xAllocationVoting, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      const initialCap = await xAllocationVoting.appSharesCap()

      await xAllocationVoting.connect(owner).setAppSharesCap(3)

      const updatedCap = await xAllocationVoting.appSharesCap()
      expect(updatedCap).to.eql(3n)
      expect(updatedCap).to.not.eql(initialCap)
    })

    it("Only admin can change app shares cap", async function () {
      const { xAllocationVoting, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: true })

      const initialCap = await xAllocationVoting.appSharesCap()

      await expect(xAllocationVoting.connect(otherAccounts[0]).setAppSharesCap(3)).to.be.reverted

      const updatedCap = await xAllocationVoting.appSharesCap()
      expect(updatedCap).to.eql(initialCap)
    })
  })

  describe("Allocation rounds", function () {
    it("Should be able to start a new allocation round successfully", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

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

      await waitForRoundToEnd(roundId)

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
      const { xAllocationVoting, emissions, minterAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      //no round at start
      let round = parseInt((await xAllocationVoting.currentRoundId()).toString())
      expect(round).to.eql(0)

      // Bootstrap emissions
      await bootstrapEmissions()

      await emissions.connect(minterAccount).start()

      // round should be created
      round = parseInt((await xAllocationVoting.currentRoundId()).toString())
      expect(round).to.eql(1)

      // should be active
      let state = await xAllocationVoting.state(round)
      expect(state).to.eql(0n)

      // distribute second emission (should start also new round)
      await moveToCycle(3)

      // first round should be ended and successfull (total supply is 0)
      state = await xAllocationVoting.state(round)
      expect(state).to.eql(2n)

      // round should be created
      round = parseInt((await xAllocationVoting.currentRoundId()).toString())
      expect(round).to.eql(2)
    })

    it("Only user with role should be able to start a new allocation round", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const roundStarterRole = await xAllocationVoting.ROUND_STARTER_ROLE()
      expect(await xAllocationVoting.hasRole(roundStarterRole, otherAccounts[7].address)).to.eql(false)
      await expect(xAllocationVoting.connect(otherAccounts[7]).startNewRound()).to.be.reverted

      // grant role
      await xAllocationVoting.connect(owner).grantRole(roundStarterRole, otherAccounts[7].address)
      expect(await xAllocationVoting.hasRole(roundStarterRole, otherAccounts[7].address)).to.eql(true)
      await expect(xAllocationVoting.connect(otherAccounts[7]).startNewRound()).to.not.be.reverted
    })

    it("Current round snapshot and deadline are correctly returned", async function () {
      const { xAllocationVoting, emissions, minterAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      await emissions.connect(minterAccount).start()

      let roundId = await xAllocationVoting.currentRoundId()
      let roundSnapshot = await xAllocationVoting.currentRoundSnapshot()
      let deadline = await xAllocationVoting.currentRoundDeadline()

      expect(roundSnapshot).to.eql(await xAllocationVoting.roundSnapshot(roundId))
      expect(deadline).to.eql(await xAllocationVoting.roundDeadline(roundId))
    })
  })

  describe("App availability for allocation voting", function () {
    it("Should be possible to add an app and make it available for allocation voting", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const app1Id = await xAllocationVoting.hashName(otherAccounts[0].address)

      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      let roundId = await startNewAllocationRound()

      const isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, roundId)
      expect(isEligibleForVote).to.eql(true)
    })

    it("Admin can make an app unavailable for allocation voting starting from next round", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const app1Id = await xAllocationVoting.hashName(otherAccounts[0].address)
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      let round1 = await startNewAllocationRound()

      await xAllocationVoting.connect(owner).setVotingElegibility(app1Id, false)

      // app should still be eligible for the current round
      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      let appsVotedInSpecificRound = await xAllocationVoting.getRoundApps(round1)
      expect(appsVotedInSpecificRound.length).to.equal(1n)

      await waitForRoundToEnd(round1)
      let round2 = await startNewAllocationRound()

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
      const { otherAccounts, xAllocationVoting, emissions } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await bootstrapAndStartEmissions()

      const app1Id = await xAllocationVoting.hashName("Bike 4 Life")
      const proposer = otherAccounts[0]
      const voter1 = otherAccounts[1]

      // check that app does not exists
      await expect(xAllocationVoting.getApp(app1Id)).to.be.reverted

      await createProposalAndExecuteIt(
        proposer,
        voter1,
        xAllocationVoting,
        await ethers.getContractFactory("XAllocationVoting"),
        "Add app to the list",
        "addApp",
        [otherAccounts[0].address, otherAccounts[0].address, "Bike 4 Life", "metadataURI"],
      )

      // start new round
      await emissions.distribute()
      let round1 = await xAllocationVoting.currentRoundId()
      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      await waitForCurrentRoundToEnd()

      await createProposalAndExecuteIt(
        proposer,
        voter1,
        xAllocationVoting,
        await ethers.getContractFactory("XAllocationVoting"),
        "Exclude app from the allocation voting rounds",
        "setVotingElegibility",
        [app1Id, false],
      )

      // app should still be eligible for the current round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      await waitForCurrentRoundToEnd()

      await emissions.distribute()
      let round2 = await xAllocationVoting.currentRoundId()

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
      const { otherAccounts, owner, xAllocationVoting } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      const voter = otherAccounts[0]
      await getVot3Tokens(voter, "1000")

      const app1Id = await xAllocationVoting.hashName(otherAccounts[0].address)

      let round1 = await startNewAllocationRound()

      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(false)

      //check that I cannot vote for this app in current round
      await catchRevert(xAllocationVoting.connect(voter).castVote(round1, [app1Id], [ethers.parseEther("1")]))

      let appVotes = await xAllocationVoting.getAppVotes(round1, app1Id)
      expect(appVotes).to.equal(0n)

      let appsVotedInSpecificRound = await xAllocationVoting.getRoundApps(round1)
      expect(appsVotedInSpecificRound.length).to.equal(0)

      await waitForRoundToEnd(round1)
      let round2 = await startNewAllocationRound()

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
      const { xAllocationVoting, otherAccounts, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
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
      const { xAllocationVoting, otherAccounts, otherAccount, owner, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions()

      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      await getVot3Tokens(otherAccount, "1000")

      await emissions.connect(minterAccount).start()

      let roundId = await xAllocationVoting.currentRoundId()
      expect(roundId).to.eql(1n)

      // I should be able to cast a vote
      let tx = await xAllocationVoting.connect(otherAccount).castVote(roundId, [app1], [ethers.parseEther("1000")])
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let allocationVoteCast = filterEventsByName(receipt.logs, "AllocationVoteCast")
      expect(allocationVoteCast).not.to.eql([])

      let {
        voter,
        apps: votedApps,
        voteWeights,
        roundId: votedRoundId,
      } = parseAllocationVoteCastEvent(allocationVoteCast[0], xAllocationVoting)
      expect(voter).to.eql(otherAccount.address)
      expect(votedRoundId).to.eql(roundId)
      expect(votedApps).to.eql([app1])
      expect(voteWeights).to.eql([ethers.parseEther("1000")])

      // Votes should be tracked correctly
      let appVotes = await xAllocationVoting.getAppVotes(roundId, app1)
      expect(appVotes).to.eql(ethers.parseEther("1000"))

      let totalVotes = await xAllocationVoting.totalVotes(roundId)
      expect(totalVotes).to.eql(ethers.parseEther("1000"))
    })

    it("I should not be able to cast vote twice", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      // Bootstrap emissions
      await bootstrapEmissions()

      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
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
      const { xAllocationVoting, otherAccounts, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
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

      await waitForRoundToEnd(roundId)

      // I cannot cast a vote if the round is not active
      await catchRevert(xAllocationVoting.connect(otherAccount).castVote(roundId, [app1], [ethers.parseEther("500")]))
    })

    it("I should be able to vote for multiple apps", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      // Bootstrap emissions
      await bootstrapEmissions()

      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")
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
      const { xAllocationVoting, otherAccounts, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")
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

      await waitForRoundToEnd(roundId)

      // Votes should be the same after round ended
      appVotes = await xAllocationVoting.getAppVotes(roundId, app1)
      expect(appVotes).to.eql(ethers.parseEther("600"))
      appVotes = await xAllocationVoting.getAppVotes(roundId, app2)
      expect(appVotes).to.eql(ethers.parseEther("800"))

      totalVotes = await xAllocationVoting.totalVotes(roundId)
      expect(totalVotes).to.eql(ethers.parseEther("1400"))
    })

    it("If no one votes everything is tracked correctly", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, owner, emissions, minterAccount, xAllocationPool } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions()

      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      await getVot3Tokens(otherAccount, "1000")

      await emissions.connect(minterAccount).start()

      let roundId = await xAllocationVoting.currentRoundId()
      expect(roundId).to.eql(1n)

      await waitForRoundToEnd(Number(roundId))
      expect(await xAllocationVoting.state(roundId)).to.eql(1n) // quorum failed

      // Votes should be tracked correctly
      let appVotes = await xAllocationVoting.getAppVotes(roundId, app1)
      expect(appVotes).to.eql(ethers.parseEther("0"))

      let totalVotes = await xAllocationVoting.totalVotes(roundId)
      expect(totalVotes).to.eql(ethers.parseEther("0"))

      let totalVoters = await xAllocationVoting.totalVoters(roundId)
      expect(totalVoters).to.eql(BigInt(0))

      let appShares = await xAllocationPool.getAppShares(roundId, app1)
      expect(appShares).to.eql([0n, 0n])

      let appEarnings = await xAllocationPool.roundEarnings(roundId, app1)
      expect(appEarnings).to.eql([await xAllocationPool.baseAllocationAmount(roundId), 0n])
    })

    it("I can start a new round if no one voted in the previous one", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, owner, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions()

      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      await getVot3Tokens(otherAccount, "1000")

      await emissions.connect(minterAccount).start()

      let roundId = await xAllocationVoting.currentRoundId()
      expect(roundId).to.eql(1n)

      await waitForRoundToEnd(Number(roundId))
      expect(await xAllocationVoting.state(roundId)).to.eql(1n) // quorum failed

      await expect(emissions.distribute()).to.not.be.reverted
      roundId = await xAllocationVoting.currentRoundId()
      expect(roundId).to.eql(2n)
    })

    it("I should be able to vote only for apps available in the allocation round", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")
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
      const { xAllocationVoting, otherAccounts, otherAccount, owner, vot3 } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")
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

      await waitForRoundToEnd(roundId)

      // Check totalSupply
      const totalSupply = await vot3.getPastTotalSupply(timepoint)
      // Check quorum
      const quorum = await xAllocationVoting.quorum(timepoint)
      // calculate how much is needed to reach quorum from total supply
      const neededVotes = (Number(ethers.formatEther(quorum)) * Number(ethers.formatEther(totalSupply))) / 100
      expect(5000).to.be.greaterThan(neededVotes)

      // quorum should be reached and round should be successful
      expect(await xAllocationVoting.state(roundId)).to.eql(BigInt(2))
    }).timeout(18000000)

    it("Allocation round should be failed if quorum was not reached", async function () {
      const { xAllocationVoting, otherAccounts, otherAccount, owner, vot3 } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")
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

      await waitForRoundToEnd(roundId)

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
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // 2 apps in round1
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
      let round1 = await startNewAllocationRound()
      let getRoundApps = await xAllocationVoting.getRoundApps(round1)
      expect(getRoundApps.length).to.equal(2n)

      // add new app before round ends
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, otherAccounts[3].address, "metadataURI")
      await waitForRoundToEnd(round1)

      // 4 apps in round2
      let round2 = await startNewAllocationRound()
      getRoundApps = await xAllocationVoting.getRoundApps(round2)
      expect(getRoundApps.length).to.equal(4n)

      // remove apps before round ends
      await xAllocationVoting.setVotingElegibility(app1, false)
      await xAllocationVoting.setVotingElegibility(app2, false)
      await waitForRoundToEnd(round2)

      // 2 app in round 3
      let round3 = await startNewAllocationRound()
      getRoundApps = await xAllocationVoting.getRoundApps(round3)
      expect(getRoundApps.length).to.equal(2n)

      // add another app before round ends
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[4].address, otherAccounts[4].address, otherAccounts[4].address, "metadataURI")
      await waitForRoundToEnd(round3)

      // 3 apps in round 4
      let round4 = await startNewAllocationRound()
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
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
      let round1 = await startNewAllocationRound()
      let getRoundApps = await xAllocationVoting.getRoundApps(round1)
      expect(getRoundApps.length).to.equal(2n)

      let apps = await xAllocationVoting.getRoundAppsWithDetails(round1)
      expect(apps.length).to.equal(2n)
      expect(apps[0].id).to.equal(app1)
      expect(apps[1].id).to.equal(app2)
      expect(apps[0].name).to.equal(otherAccounts[0].address)
      expect(apps[1].name).to.equal(otherAccounts[1].address)
    })

    it("Stores that a user voted at least once", async function () {
      const { xAllocationVoting, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // Check if user voted
      let voted = await xAllocationVoting.hasVotedOnce(otherAccount.address)
      expect(voted).to.equal(false)

      await getVot3Tokens(otherAccount, "1")
      await getVot3Tokens(owner, "1000")

      const appName = "App"

      await xAllocationVoting.connect(owner).addApp(otherAccount.address, otherAccount.address, appName, "metadataURI")
      const roundId = await startNewAllocationRound()

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

      let round1 = await startNewAllocationRound()
      await waitForRoundToEnd(round1)

      let isFinalized = await xAllocationVoting.isFinalized(round1)
      expect(isFinalized).to.eql(false)

      await startNewAllocationRound()

      isFinalized = await xAllocationVoting.isFinalized(round1)
      expect(isFinalized).to.eql(true)
    })

    it("Anyone can manually trigger round finalization", async function () {
      const { xAllocationVoting, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      await getVot3Tokens(otherAccount, "1000")

      let round1 = await startNewAllocationRound()
      await waitForRoundToEnd(round1)

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

      let round1 = await startNewAllocationRound()

      await catchRevert(xAllocationVoting.finalize(round1))

      let isFinalized = await xAllocationVoting.isFinalized(round1)
      expect(isFinalized).to.eql(false)
    })
  })

  describe("Quadratic Funding", function () {
    it("Can get the correct QF app votes", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      otherAccounts.forEach(async account => {
        await getVot3Tokens(account, "10000")
      })

      //Add apps

      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[3].address))
      const app3Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[4].address))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, otherAccounts[3].address, "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[4].address, otherAccounts[4].address, otherAccounts[4].address, "metadataURI")

      //Start allocation round
      const round1 = await startNewAllocationRound()
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
        .castVote(round1, [app2Id, app3Id], [ethers.parseEther("100"), ethers.parseEther("100")])

      await xAllocationVoting
        .connect(otherAccounts[5])
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("1000"), ethers.parseEther("0"), ethers.parseEther("100")],
        )

      await waitForRoundToEnd(round1)

      const expectedUnsquaredVotesApp1 = Math.sqrt(0) + Math.sqrt(0) + Math.sqrt(0) + Math.sqrt(0) + Math.sqrt(1000)
      const app1VotesQF = await xAllocationVoting.getAppVotesQF(round1, app1Id)
      // sqrt of 10^18 is 10^9 hence we need to divide by 10^9
      expect(app1VotesQF).to.equal(ethers.parseEther(expectedUnsquaredVotesApp1.toString()) / 1000000000n)

      const expectedUnsquaredVotesApp2 =
        Math.sqrt(900) + Math.sqrt(500) + Math.sqrt(100) + Math.sqrt(100) + Math.sqrt(0)
      const app2VotesQF = await xAllocationVoting.getAppVotesQF(round1, app2Id)
      expect(app2VotesQF).to.equal(ethers.parseEther(expectedUnsquaredVotesApp2.toString()) / 1000000000n)

      const expectedUnsquaredVotesApp3 =
        Math.sqrt(100) + Math.sqrt(100) + Math.sqrt(100) + Math.sqrt(100) + Math.sqrt(100)
      const app3VotesQF = await xAllocationVoting.getAppVotesQF(round1, app3Id)
      expect(app3VotesQF).to.equal(ethers.parseEther(expectedUnsquaredVotesApp3.toString()) / 1000000000n)

      const expectedTotalVotesQF =
        expectedUnsquaredVotesApp1 ** 2 + expectedUnsquaredVotesApp2 ** 2 + expectedUnsquaredVotesApp3 ** 2
      const totalVotes = await xAllocationVoting.totalVotesQF(round1)

      expect(Number(ethers.formatEther(totalVotes)).toFixed(6)).to.equal(expectedTotalVotesQF.toFixed(6))

      const expectedAppShare1 = expectedUnsquaredVotesApp1 ** 2 / expectedTotalVotesQF
      const appShare1 = Number(app1VotesQF) ** 2 / Number(totalVotes)
      expect(appShare1.toFixed(6)).to.equal(expectedAppShare1.toFixed(6))
      expect(appShare1.toFixed(4)).to.equal("0.1145") // 11.45% of the total votes

      const expectedAppShare2 = expectedUnsquaredVotesApp2 ** 2 / expectedTotalVotesQF
      const appShare2 = Number(app2VotesQF) ** 2 / Number(totalVotes)
      expect(appShare2.toFixed(6)).to.equal(expectedAppShare2.toFixed(6))
      expect(appShare2.toFixed(4)).to.equal("0.5994") // 59.94% of the total votes

      const expectedAppShare3 = expectedUnsquaredVotesApp3 ** 2 / expectedTotalVotesQF
      const appShare3 = Number(app3VotesQF) ** 2 / Number(totalVotes)
      expect(appShare3.toFixed(6)).to.equal(expectedAppShare3.toFixed(6))
      expect(appShare3.toFixed(4)).to.equal("0.2862") // 28.61% of the total votes
    })
  })

  describe("Quorum", function () {
    it("Can get quorum of round successfully", async function () {
      const { xAllocationVoting, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await getVot3Tokens(otherAccount, "1000")

      // Bootstrap emissions
      await bootstrapEmissions()

      let round1 = await startNewAllocationRound()
      await waitForRoundToEnd(round1)

      let quorum = await xAllocationVoting.roundQuorum(round1)

      let snapshot = await xAllocationVoting.roundSnapshot(round1)
      let quorumAtSnapshot = await xAllocationVoting.quorum(snapshot)

      expect(quorum).to.eql(quorumAtSnapshot)
    })
  })
})
