import { ethers } from "hardhat"
import { expect } from "chai"
import {
  createProposal,
  getOrDeployContractInstances,
  getProposalIdFromTx,
  getVot3Tokens,
  waitForNextBlock,
  waitForVotingPeriodToEnd,
  catchRevert,
  waitForProposalToBeActive,
  participateInGovernanceVoting,
  bootstrapAndStartEmissions,
  waitForCurrentRoundToEnd,
  moveBlocks,
  createProposalAndExecuteIt,
} from "./helpers"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { describe, it } from "mocha"
import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { getImplementationAddress } from "@openzeppelin/upgrades-core"
import { B3TRGovernor } from "../typechain-types"

describe("Governor and TimeLock", function () {
  describe("Governor deployment", function () {
    it("should set constructors correctly", async function () {
      const config = createLocalConfig()
      const { governor, vot3, owner, timeLock, xAllocationVoting, voterRewards } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await bootstrapAndStartEmissions()

      const votesThreshold = (await governor.proposalThreshold()).toString()
      const votingPeriod = await governor.votingPeriod()
      const minVotingDelay = await governor.minVotingDelay()

      expect(votesThreshold).to.eql(config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD.toString())
      expect(votingPeriod).to.eql(await xAllocationVoting.votingPeriod())
      expect(minVotingDelay.toString()).to.eql(config.B3TR_GOVERNOR_MIN_VOTING_DELAY.toString())

      const xAllocationVotingAddress = await governor.xAllocationVotingAddress()
      const voterRewardsAddress = await governor.voterRewardsAddress()

      expect(xAllocationVotingAddress).to.eql(await xAllocationVoting.getAddress())
      expect(voterRewardsAddress).to.eql(await voterRewards.getAddress())

      // proposers votes should be 0
      const clock = await governor.clock()
      const proposerVotes = await governor.getVotes(owner, (clock - BigInt(1)).toString())
      expect(proposerVotes.toString()).to.eql("0")

      // check name of the governor contract
      const name = await governor.name()
      expect(name).to.eql("B3TRGovernor")

      // check that the VOT3 address is correct
      const voteTokenAddress = await governor.token()
      expect(voteTokenAddress).to.eql(await vot3.getAddress())

      // check that the TimeLock address is correct
      const timeLockAddress = await governor.timelock()
      expect(timeLockAddress).to.eql(await timeLock.getAddress())

      // clock mode is set correctly
      const clockMode = await governor.CLOCK_MODE()
      expect(clockMode.toString()).to.eql("mode=blocknumber&from=default")
    })

    it("should be able to upgrade the governor contract through governance", async function () {
      const { governor, owner, b3tr, emissions, xAllocationVoting } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const votesThreshold = await governor.proposalThreshold()
      await getVot3Tokens(owner, (votesThreshold + BigInt(1)).toString())

      // Start emissions
      await bootstrapAndStartEmissions()

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("B3TRGovernor")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      // V1 Contract
      const V1Contract = await ethers.getContractAt("B3TRGovernor", await governor.getAddress())

      // Now we can create a proposal
      const encodedFunctionCall = V1Contract.interface.encodeFunctionData("upgradeToAndCall", [
        await implementation.getAddress(),
        "0x",
      ])
      const description = "Upgrading Governance contracts"
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description))

      const tx = await governor
        .connect(owner) //@ts-ignore, https://github.com/ethers-io/ethers.js/issues/4296
        .propose([await governor.getAddress()], [0], [encodedFunctionCall], description)

      const proposalId = await getProposalIdFromTx(tx)
      await waitForProposalToBeActive(proposalId)

      await governor.connect(owner).castVote(proposalId, 1)
      await waitForVotingPeriodToEnd(proposalId)
      expect(await governor.state(proposalId)).to.eql(4n) // succeded

      await governor.queue([await governor.getAddress()], [0], [encodedFunctionCall], descriptionHash)
      expect(await governor.state(proposalId)).to.eql(5n)

      await governor.execute([await governor.getAddress()], [0], [encodedFunctionCall], descriptionHash)
      expect(await governor.state(proposalId)).to.eql(7n)

      const newImplAddress = await getImplementationAddress(ethers.provider, await governor.getAddress())
      expect(newImplAddress.toUpperCase()).to.eql((await implementation.getAddress()).toUpperCase())

      // Check that the new implementation works
      const newGovernor = Contract.attach(await governor.getAddress()) as B3TRGovernor

      // start new round
      await emissions.distribute()

      // create a new proposal
      const newTx = await newGovernor
        .connect(owner) //@ts-ignore
        .propose(
          [await b3tr.getAddress()],
          [0],
          [encodedFunctionCall],
          description,
          (await xAllocationVoting.currentRoundId()) + 1n,
          {
            gasLimit: 10_000_000,
          },
        )
      const proposeReceipt = await newTx.wait()
      const event = proposeReceipt?.logs[0]
      const decodedLogs = newGovernor.interface.parseLog({
        topics: [...(event?.topics as string[])],
        data: event ? event.data : "",
      })
      const newProposalId = decodedLogs?.args[0]

      expect(newProposalId).to.exist
      // expect data of previous contract to be untouched
      expect(await governor.state(proposalId)).to.eql(7n)
      expect(await governor.quorumReached(proposalId)).to.eql(true)
    })
  })

  describe("Governor settings", function () {
    it("should be able to update the xAllocationVoting address through governance", async function () {
      const { governor, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const newAddress = ethers.Wallet.createRandom().address
      await createProposalAndExecuteIt(
        owner,
        owner,
        governor,
        await ethers.getContractFactory("B3TRGovernor"),
        "Update xAllocationVoting address",
        "setXAllocationVoting",
        [newAddress],
      )

      const updatedAddress = await governor.xAllocationVotingAddress()
      expect(updatedAddress).to.eql(newAddress)
    })

    it("only governance can update xAllocationVoting address", async function () {
      const { governor, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const newAddress = ethers.Wallet.createRandom().address

      await catchRevert(governor.connect(owner).setXAllocationVoting(newAddress))

      const updatedAddress = await governor.xAllocationVotingAddress()
      expect(updatedAddress).to.not.eql(newAddress)
    })

    it("can update voterRewards address through governance", async function () {
      const { governor, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const newAddress = ethers.Wallet.createRandom().address
      await createProposalAndExecuteIt(
        owner,
        owner,
        governor,
        await ethers.getContractFactory("B3TRGovernor"),
        "Update Voter Rewards address",
        "setVoterRewards",
        [newAddress],
      )

      const updatedAddress = await governor.voterRewardsAddress()
      expect(updatedAddress).to.eql(newAddress)
    })

    it("only governance can update voterRewards address", async function () {
      const { governor, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const newAddress = ethers.Wallet.createRandom().address

      await catchRevert(governor.connect(owner).setVoterRewards(newAddress))

      const updatedAddress = await governor.voterRewardsAddress()
      expect(updatedAddress).to.not.eql(newAddress)
    })

    it("can update proposal threshold through governance", async function () {
      const { governor, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const newThreshold = 10n
      await createProposalAndExecuteIt(
        owner,
        owner,
        governor,
        await ethers.getContractFactory("B3TRGovernor"),
        "Update Proposal Threshold",
        "setProposalThreshold",
        [newThreshold],
      )

      const updatedThreshold = await governor.proposalThreshold()
      expect(updatedThreshold).to.eql(newThreshold)
    })

    it("only governance can update proposal threshold", async function () {
      const { governor, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const newThreshold = 10n

      await catchRevert(governor.connect(owner).setProposalThreshold(newThreshold))

      const updatedThreshold = await governor.proposalThreshold()
      expect(updatedThreshold).to.not.eql(newThreshold)
    })

    it("can update min voting delay through governance", async function () {
      const { governor, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const newDelay = 10n
      await createProposalAndExecuteIt(
        owner,
        owner,
        governor,
        await ethers.getContractFactory("B3TRGovernor"),
        "Update Min Voting Delay",
        "setMinVotingDelay",
        [newDelay],
      )

      const updatedDelay = await governor.minVotingDelay()
      expect(updatedDelay).to.eql(newDelay)
    })

    it("only governance can update min voting delay", async function () {
      const { governor, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const newDelay = 10n

      await catchRevert(governor.connect(owner).setMinVotingDelay(newDelay))

      const updatedDelay = await governor.minVotingDelay()
      expect(updatedDelay).to.not.eql(newDelay)
    })
  })

  describe("Proposal Creation", function () {
    it("When creating a proposal we should specify the round when it should become active", async () => {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
      config.EMISSIONS_CYCLE_DURATION = 5
      const { b3tr, otherAccounts, governor, B3trContract, xAllocationVoting } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      const proposer = otherAccounts[0]
      await getVot3Tokens(proposer, "1000")

      // Start emissions
      await bootstrapAndStartEmissions()

      const currentRoundsEndsAt = await xAllocationVoting.currentRoundDeadline()

      // Now we can create a new proposal
      const address = await b3tr.getAddress()
      const encodedFunctionCall = B3trContract.interface.encodeFunctionData("tokenDetails", [])
      const voteStartsInRoundId = (await xAllocationVoting.currentRoundId()) + 1n // starts in next round
      const tx = await governor
        .connect(proposer) //@ts-ignore, https://github.com/ethers-io/ethers.js/issues/4296
        .propose([address], [0], [encodedFunctionCall], "", voteStartsInRoundId.toString(), {
          gasLimit: 10_000_000,
        })

      const proposeReceipt = await tx.wait()
      expect(proposeReceipt).not.to.be.null

      // Check that the ProposalCreated event was emitted with the correct parameters
      const event = proposeReceipt?.logs[0]
      expect(event).not.to.be.undefined

      const decodedLogs = governor.interface.parseLog({
        topics: [...(event?.topics as string[])],
        data: event ? event.data : "",
      })

      // roundId when proposal will start
      expect(decodedLogs?.args[7]).to.eql(2n)

      const proposalId = await getProposalIdFromTx(tx)
      expect(proposalId).not.to.be.null

      expect(await governor.state(proposalId)).to.eql(0n) // pending

      expect(await governor.proposalSnapshot(proposalId)).to.eql(currentRoundsEndsAt + 1n) // proposal should start at the end of the current round + 1 block
      expect(await governor.proposalDeadline(proposalId)).to.eql(
        currentRoundsEndsAt + 1n + (await xAllocationVoting.votingPeriod()),
      ) // proposal should end at the end of the current round + 1 block + voting period

      expect(await governor.proposalStartRound(proposalId)).to.eql(2n) // proposal should start in round 2
    })

    it("Can create a proposal that starts after 2 rounds", async () => {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
      config.EMISSIONS_CYCLE_DURATION = 5
      const { b3tr, otherAccounts, governor, B3trContract, xAllocationVoting, emissions } =
        await getOrDeployContractInstances({
          forceDeploy: true,
          config,
        })

      const proposer = otherAccounts[0]
      await getVot3Tokens(proposer, "1000")

      // Start emissions
      await bootstrapAndStartEmissions()

      // Now we can create a new proposal
      const address = await b3tr.getAddress()
      const encodedFunctionCall = B3trContract.interface.encodeFunctionData("tokenDetails", [])
      const voteStartsInRoundId = (await xAllocationVoting.currentRoundId()) + 2n // starts 2 rounds from now
      const tx = await governor
        .connect(proposer) //@ts-ignore, https://github.com/ethers-io/ethers.js/issues/4296
        .propose([address], [0], [encodedFunctionCall], "", voteStartsInRoundId.toString(), {
          gasLimit: 10_000_000,
        })

      const proposeReceipt = await tx.wait()
      expect(proposeReceipt).not.to.be.null

      // Check that the ProposalCreated event was emitted with the correct parameters
      const event = proposeReceipt?.logs[0]
      expect(event).not.to.be.undefined

      const decodedLogs = governor.interface.parseLog({
        topics: [...(event?.topics as string[])],
        data: event ? event.data : "",
      })

      // roundId when proposal will start
      expect(decodedLogs?.args[7]).to.eql(3n)

      const proposalId = await getProposalIdFromTx(tx)
      expect(proposalId).not.to.be.null

      expect(await governor.state(proposalId)).to.eql(0n) // pending

      await waitForCurrentRoundToEnd()
      expect(await xAllocationVoting.currentRoundId()).to.eql(1n)
      expect(await governor.state(proposalId)).to.eql(0n) // pending
      await expect(governor.connect(proposer).castVote(proposalId, 0)).to.be.reverted

      await emissions.distribute()
      expect(await xAllocationVoting.currentRoundId()).to.eql(2n)
      expect(await governor.state(proposalId)).to.eql(0n) // pending
      await expect(governor.connect(proposer).castVote(proposalId, 0)).to.be.reverted

      await waitForCurrentRoundToEnd()
      expect(await xAllocationVoting.currentRoundId()).to.eql(2n)
      expect(await governor.state(proposalId)).to.eql(0n) // pending
      await expect(governor.connect(proposer).castVote(proposalId, 0)).to.be.reverted

      await emissions.distribute()
      expect(await xAllocationVoting.currentRoundId()).to.eql(3n)
      expect(await governor.state(proposalId)).to.eql(1n) // active
      await expect(governor.connect(proposer).castVote(proposalId, 0)).to.not.be.reverted
    })

    it("Proposal snapshot and deadline behaves correctly", async () => {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
      config.EMISSIONS_CYCLE_DURATION = 5
      const { b3tr, otherAccounts, governor, B3trContract, xAllocationVoting, emissions } =
        await getOrDeployContractInstances({
          forceDeploy: true,
          config,
        })

      const proposer = otherAccounts[0]
      await getVot3Tokens(proposer, "1000")

      // Start emissions
      await bootstrapAndStartEmissions()

      const tx = await governor
        .connect(proposer) //@ts-ignore
        .propose(
          [await b3tr.getAddress()],
          [0],
          [B3trContract.interface.encodeFunctionData("tokenDetails", [])],
          "Creating some random proposal",
          (await xAllocationVoting.currentRoundId()) + 1n,
          {
            gasLimit: 10_000_000,
          },
        )

      const proposalId = await getProposalIdFromTx(tx)

      // since round 2 did not start yet the proposal snapshot should be an estimation
      const snapshot = await governor.proposalSnapshot(proposalId)
      const currentRoundEndsAt = await xAllocationVoting.currentRoundDeadline()
      expect(snapshot).to.eql(currentRoundEndsAt + 1n)

      // same for the deadline
      const deadline = await governor.proposalDeadline(proposalId)
      expect(deadline).to.eql(currentRoundEndsAt + 1n + (await xAllocationVoting.votingPeriod()))

      // now we can simulate that the round starts with a few blocks of delay
      await waitForCurrentRoundToEnd()
      await moveBlocks(2)
      await emissions.distribute()

      // proposal should be active
      expect(await governor.state(proposalId)).to.eql(1n)

      // snapshot should be the start of the round and should be different from the estimated one
      const newSnapshot = await governor.proposalSnapshot(proposalId)
      expect(newSnapshot).to.eql(await xAllocationVoting.currentRoundSnapshot())
      expect(newSnapshot).to.not.eql(snapshot)

      // same for deadline
      const newDeadline = await governor.proposalDeadline(proposalId)
      expect(newDeadline).to.eql(await xAllocationVoting.currentRoundDeadline())
      expect(newDeadline).to.not.eql(deadline)

      // once the round ends the snapshot and deadline should be the same
      await waitForCurrentRoundToEnd()
      expect(await governor.state(proposalId)).to.not.eql(1n)

      const finalSnapshot = await governor.proposalSnapshot(proposalId)
      const finalDeadline = await governor.proposalDeadline(proposalId)
      expect(finalSnapshot).to.eql(newSnapshot)
      expect(finalDeadline).to.eql(newDeadline)
    })

    it("Creating proposal through deprecated propose() function will create a proposal starting next round", async () => {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
      config.EMISSIONS_CYCLE_DURATION = 5
      const { b3tr, otherAccounts, governor, B3trContract, xAllocationVoting } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      const proposer = otherAccounts[0]
      await getVot3Tokens(proposer, "1000")

      // Start emissions
      await bootstrapAndStartEmissions()

      // old propose() function without the voteStartInRound parameter
      const tx = await governor
        .connect(proposer) //@ts-ignore
        .propose(
          [await b3tr.getAddress()],
          [0],
          [B3trContract.interface.encodeFunctionData("tokenDetails", [])],
          "Creating some random proposal",
        )

      const proposalId = await getProposalIdFromTx(tx)
      const voteStartsInRound = await governor.proposalStartRound(proposalId)
      expect(voteStartsInRound).to.eql((await xAllocationVoting.currentRoundId()) + 1n)
    })

    it("Period between proposal creation and round start must be higher than min delay set in the contract", async () => {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
      config.EMISSIONS_CYCLE_DURATION = 5
      config.B3TR_GOVERNOR_MIN_VOTING_DELAY = 3
      const { b3tr, otherAccounts, governor, B3trContract, xAllocationVoting, emissions } =
        await getOrDeployContractInstances({
          forceDeploy: true,
          config,
        })

      const proposer = otherAccounts[0]
      await getVot3Tokens(proposer, "1000")

      // Start emissions
      await bootstrapAndStartEmissions()

      // simulate 2 blocks passed
      await moveBlocks(2)

      // we should be in the following situation
      let currentBlock = await governor.clock()
      let currentRoundsEndsAt = await xAllocationVoting.currentRoundDeadline()
      let minVotingDelay = await governor.minVotingDelay()
      expect(minVotingDelay).to.be.greaterThan(currentRoundsEndsAt - currentBlock)

      // Now if we create a proposal it should revert because the start of the next round is too close
      let voteStartsInRoundId = (await xAllocationVoting.currentRoundId()) + 1n // starts in next round
      await expect(
        governor
          .connect(proposer) //@ts-ignore, https://github.com/ethers-io/ethers.js/issues/4296
          .propose(
            [await b3tr.getAddress()],
            [0],
            [B3trContract.interface.encodeFunctionData("tokenDetails", [])],
            "",
            voteStartsInRoundId.toString(),
            {
              gasLimit: 10_000_000,
            },
          ),
      ).to.be.reverted

      // simulate start of new round with enough voting delay
      await waitForCurrentRoundToEnd()
      await emissions.distribute()

      // we should be in the following situation
      currentBlock = await governor.clock()
      currentRoundsEndsAt = await xAllocationVoting.currentRoundDeadline()
      minVotingDelay = await governor.minVotingDelay()
      expect(minVotingDelay).to.not.be.greaterThan(currentRoundsEndsAt - currentBlock)

      // Now if we create a proposal it should not revert
      voteStartsInRoundId = (await xAllocationVoting.currentRoundId()) + 1n // starts in next round

      await expect(
        governor
          .connect(proposer) //@ts-ignore, https://github.com/ethers-io/ethers.js/issues/4296
          .propose(
            [await b3tr.getAddress()],
            [0],
            [B3trContract.interface.encodeFunctionData("tokenDetails", [])],
            "",
            voteStartsInRoundId.toString(),
            {
              gasLimit: 10_000_000,
            },
          ),
      ).to.not.be.reverted
    })

    it("Proposal is not active until the target round starts", async () => {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
      config.EMISSIONS_CYCLE_DURATION = 5
      const { b3tr, otherAccounts, governor, B3trContract, emissions, xAllocationVoting } =
        await getOrDeployContractInstances({
          forceDeploy: true,
          config,
        })

      const proposer = otherAccounts[0]
      await getVot3Tokens(proposer, "1000")

      // Start emissions
      await bootstrapAndStartEmissions()

      // Now we can create a new proposal
      const address = await b3tr.getAddress()
      const encodedFunctionCall = B3trContract.interface.encodeFunctionData("tokenDetails", [])
      const voteStartsInRoundId = (await xAllocationVoting.currentRoundId()) + 1n // starts in next round
      const tx = await governor
        .connect(proposer) //@ts-ignore
        .propose([address], [0], [encodedFunctionCall], "", voteStartsInRoundId.toString(), {
          gasLimit: 10_000_000,
        })

      const proposeReceipt = await tx.wait()
      expect(proposeReceipt).not.to.be.null

      const proposalId = await getProposalIdFromTx(tx)
      expect(proposalId).not.to.be.null

      expect(await governor.state(proposalId)).to.eql(0n) // pending

      // Move to the next round + 1 extra block
      await waitForCurrentRoundToEnd()
      await waitForNextBlock()

      // Round ended but proposal should still be pending
      expect(await governor.state(proposalId)).to.eql(0n) // pending

      // We start the new round
      await emissions.distribute()

      expect(await governor.state(proposalId)).to.eql(1n) // active
    })

    it("Proposal concludes when round ends", async () => {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
      config.EMISSIONS_CYCLE_DURATION = 5
      const { b3tr, otherAccounts, governor, B3trContract, emissions, xAllocationVoting } =
        await getOrDeployContractInstances({
          forceDeploy: true,
          config,
        })

      const proposer = otherAccounts[0]
      await getVot3Tokens(proposer, "1000")

      // Start emissions
      await bootstrapAndStartEmissions()

      // Now we can create a new proposal
      const address = await b3tr.getAddress()
      const encodedFunctionCall = B3trContract.interface.encodeFunctionData("tokenDetails", [])
      const voteStartsInRoundId = (await xAllocationVoting.currentRoundId()) + 1n // starts in next round
      const tx = await governor
        .connect(proposer) //@ts-ignore
        .propose([address], [0], [encodedFunctionCall], "", voteStartsInRoundId.toString(), {
          gasLimit: 10_000_000,
        })

      const proposeReceipt = await tx.wait()
      expect(proposeReceipt).not.to.be.null

      const proposalId = await getProposalIdFromTx(tx)
      expect(proposalId).not.to.be.null

      expect(await governor.state(proposalId)).to.eql(0n) // pending

      // Move to the next round + 1 extra block
      await waitForCurrentRoundToEnd()
      // We start the new round
      await emissions.distribute()

      expect(await governor.state(proposalId)).to.eql(1n) // active

      await waitForCurrentRoundToEnd()

      expect(await governor.state(proposalId)).to.not.eql(1n) // active
      expect(await governor.state(proposalId)).to.not.eql(0n) // pending
    })

    it("Cannot create a proposal if emissions did not start", async () => {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
      config.EMISSIONS_CYCLE_DURATION = 5
      const { b3tr, otherAccounts, governor, B3trContract, xAllocationVoting } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      const proposer = otherAccounts[0]
      await getVot3Tokens(proposer, "1000")

      // Now we can create a new proposal
      const address = await b3tr.getAddress()
      const encodedFunctionCall = B3trContract.interface.encodeFunctionData("tokenDetails", [])
      const currentRoundId = await xAllocationVoting.currentRoundId() // starts in current round
      expect(currentRoundId).to.eql(0n)

      await expect(
        governor
          .connect(proposer) //@ts-ignore
          .propose([address], [0], [encodedFunctionCall], "", 1n, {
            gasLimit: 10_000_000,
          }),
      ).to.be.reverted
    })

    it("Should not be able to create a proposal starting in a round that has already passed", async () => {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
      config.EMISSIONS_CYCLE_DURATION = 5
      const { b3tr, otherAccounts, governor, B3trContract, xAllocationVoting } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      const proposer = otherAccounts[0]
      await getVot3Tokens(proposer, "1000")

      // Start emissions
      await bootstrapAndStartEmissions()

      // Now we can create a new proposal
      const address = await b3tr.getAddress()
      const encodedFunctionCall = B3trContract.interface.encodeFunctionData("tokenDetails", [])
      let voteStartsInRoundId = (await xAllocationVoting.currentRoundId()) - 1n // starts in previous round
      await catchRevert(
        governor
          .connect(proposer) //@ts-ignore
          .propose([address], [0], [encodedFunctionCall], "", voteStartsInRoundId.toString(), {
            gasLimit: 10_000_000,
          }),
      )

      voteStartsInRoundId = await xAllocationVoting.currentRoundId() // starts in current round
      await catchRevert(
        governor
          .connect(proposer) //@ts-ignore
          .propose([address], [0], [encodedFunctionCall], "", voteStartsInRoundId.toString(), {
            gasLimit: 10_000_000,
          }),
      )
    })

    it("cannot create a proposal if NOT a VOT3 holder", async function () {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
      const { B3trContract, b3tr, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })
      // Start emissions
      await bootstrapAndStartEmissions()

      const functionToCall = "tokenDetails"
      const description = "Get token details"
      await catchRevert(createProposal(b3tr, B3trContract, owner, description, functionToCall, [], true))
    })

    it("can create a proposal even if user did not manually self delegated (because of automatic self-delegation)", async function () {
      const { B3trContract, vot3, b3tr, owner, minterAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Start emissions
      await bootstrapAndStartEmissions()

      // Before creating a proposal, we need to mint some VOT3 tokens to the owner
      await b3tr.connect(minterAccount).mint(owner, ethers.parseEther("1000"))
      await b3tr.connect(owner).approve(await vot3.getAddress(), ethers.parseEther("9"))
      await vot3.connect(owner).stake(ethers.parseEther("9"), { gasLimit: 10_000_000 })

      const functionToCall = "tokenDetails"
      const description = "Get token details"

      await createProposal(b3tr, B3trContract, owner, description, functionToCall, [], true)
    })

    it("can create a proposal if VOT3 holder that self-delegated", async function () {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
      const { governor, B3trContract, b3tr, owner, xAllocationVoting } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      // Start emissions
      await bootstrapAndStartEmissions()

      const functionToCall = "tokenDetails"
      const description = "Get token details"

      // Now we can create a proposal
      const tx = await createProposal(b3tr, B3trContract, owner, description, functionToCall, [], false)
      const proposeReceipt = await tx.wait()
      expect(proposeReceipt).not.to.be.null

      // Check that the ProposalCreated event was emitted with the correct parameters
      const event = proposeReceipt?.logs[0]
      expect(event).not.to.be.undefined

      const decodedLogs = governor.interface.parseLog({
        topics: [...(event?.topics as string[])],
        data: event ? event.data : "",
      })

      //event exists
      expect(decodedLogs?.name).to.eql("ProposalCreated")
      // proposal id
      const proposalId = decodedLogs?.args[0]
      expect(proposalId).not.to.be.null
      // proposer is the owner
      expect(decodedLogs?.args[1]).to.eql(await owner.getAddress())
      // targets are correct
      const b3trAddress = await b3tr.getAddress()
      expect(decodedLogs?.args[2]).to.eql([b3trAddress])
      // values are correct
      expect(decodedLogs?.args[3].toString()).to.eql("0")
      // signatures are correct
      expect(decodedLogs?.args[4]).not.to.be.null
      // calldatas are correct
      const encodedFunctionCall = B3trContract.interface.encodeFunctionData(functionToCall, [])
      expect(decodedLogs?.args[5]).to.eql([encodedFunctionCall])
      // description is correct
      expect(decodedLogs?.args[6]).to.eql(description)
      // round when proposal will start
      const voteStartsInRoundId = decodedLogs?.args[7]
      expect(voteStartsInRoundId).not.to.be.null
      expect(voteStartsInRoundId).to.eql((await xAllocationVoting.currentRoundId()) + 1n)

      // proposal should be in pending state
      const proposalState = await governor.state(proposalId)
      expect(proposalState.toString()).to.eql("0") // pending
    })

    it("can calculate the proposal id from the proposal parameters", async function () {
      const { governor, B3trContract, b3tr, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      const functionToCall = "tokenDetails"
      const description = "Get token details"

      // Start emissions
      await bootstrapAndStartEmissions()

      // Now we can create a proposal
      const tx = await createProposal(b3tr, B3trContract, owner, description, functionToCall, [], false)

      const proposalId = await getProposalIdFromTx(tx)

      const b3trAddress = await b3tr.getAddress()
      const encodedFunctionCall = B3trContract.interface.encodeFunctionData(functionToCall, [])

      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description))

      const retrievedProposalId = await governor.hashProposal(
        [b3trAddress],
        [0],
        [encodedFunctionCall],
        descriptionHash,
      )

      expect(proposalId).to.eql(retrievedProposalId)
    })

    it("ANY user that holds VOT3 and DELEGATED can create a proposal", async function () {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
      const { B3trContract, otherAccount, b3tr } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      // Start emissions
      await bootstrapAndStartEmissions()

      const functionToCall = "tokenDetails"
      const description = "Get token details"

      // Now we can create a proposal
      await createProposal(b3tr, B3trContract, otherAccount, description, functionToCall, [], false)
    })
  })

  // the tests described in this section cannot be run in isolation, but need to run in cascade
  describe("Proposal Voting", function () {
    let voter1: HardhatEthersSigner
    let voter2: HardhatEthersSigner
    let voter3: HardhatEthersSigner
    let voter4: HardhatEthersSigner

    const functionToCall = "tokenDetails"
    const description = "Get token details"
    let proposalId: any

    this.beforeAll(async function () {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
      config.EMISSIONS_CYCLE_DURATION = 10
      const { vot3, b3tr, otherAccounts, minterAccount, B3trContract, otherAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
          config,
        })

      voter1 = otherAccounts[0] // with no VOT3
      voter2 = otherAccounts[1] // with VOT3 but no delegation
      voter3 = otherAccounts[2] // with VOT3 and delegation
      voter4 = otherAccounts[3] // with VOT3 and delegation

      // Before trying to vote we need to mint some VOT3 tokens to the voter2
      await b3tr.connect(minterAccount).mint(voter2, ethers.parseEther("1000"))
      await b3tr.connect(voter2).approve(await vot3.getAddress(), ethers.parseEther("9"))
      await vot3.connect(voter2).stake(ethers.parseEther("9"))

      // we do it here but will use in the next test
      await getVot3Tokens(voter3, "1000")
      await getVot3Tokens(voter4, "9")

      // Start emissions
      await bootstrapAndStartEmissions()

      // Now we can create a new proposal
      const tx = await createProposal(b3tr, B3trContract, otherAccount, description, functionToCall, [], false)
      proposalId = await getProposalIdFromTx(tx)
    })

    it("cannot vote if proposal is not in active state", async function () {
      const { governor } = await getOrDeployContractInstances({ forceDeploy: false })
      // Now we can create a new proposal

      const proposalState = await governor.state(proposalId)
      expect(proposalState.toString()).to.eql("0")

      await catchRevert(governor.connect(voter3).castVote(proposalId, 1))
    })

    it("user without VOT3 can vote with weight 0", async function () {
      const { governor } = await getOrDeployContractInstances({ forceDeploy: false })

      const proposalState = await waitForProposalToBeActive(proposalId) // proposal id of the proposal in the beforeAll step & block when the proposal was created

      expect(proposalState.toString()).to.eql("1") // active

      //vote
      const tx = await governor.connect(voter1).castVote(proposalId, 1)
      const proposeReceipt = await tx.wait()
      const event = proposeReceipt?.logs[0]
      const decodedLogs = governor.interface.parseLog({
        topics: [...(event?.topics as string[])],
        data: event ? event.data : "",
      })

      //event exists
      expect(decodedLogs?.name).to.eql("VoteCast")
      // voter
      expect(decodedLogs?.args[0]).to.eql(await voter1.getAddress())
      // proposal id
      expect(decodedLogs?.args[1]).to.eql(proposalId)
      // support
      expect(decodedLogs?.args[2].toString()).to.eql("1")
      // votes
      expect(decodedLogs?.args[3].toString()).to.eql("0")
    })

    it("can vote if self-delegated VOT3 holder before snapshot", async function () {
      const { governor } = await getOrDeployContractInstances({ forceDeploy: false })

      const proposalState = await waitForProposalToBeActive(proposalId) // proposal id of the proposal in the beforeAll step & block when the proposal was created

      expect(proposalState.toString()).to.eql("1") // active

      const tx = await governor.connect(voter3).castVote(proposalId, 1)
      const proposeReceipt = await tx.wait()
      const event = proposeReceipt?.logs[0]
      const decodedLogs = governor.interface.parseLog({
        topics: [...(event?.topics as string[])],
        data: event ? event.data : "",
      })

      //event exists
      expect(decodedLogs?.name).to.eql("VoteCast")
      // voter
      expect(decodedLogs?.args[0]).to.eql(await voter3.getAddress())
      // proposal id
      expect(decodedLogs?.args[1]).to.eql(proposalId)
      // support
      expect(decodedLogs?.args[2].toString()).to.eql("1")
      // votes
      expect(decodedLogs?.args[3].toString()).not.to.eql("0")

      const hasVoted = await governor.hasVoted(proposalId, await voter3.getAddress())
      expect(hasVoted).to.eql(true)
    })

    it("vote has weight 0 if self-delegated VOT3 holder after the proposal snapshot", async function () {
      const { governor, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: false })

      const newVoter = otherAccounts[4]
      await getVot3Tokens(newVoter, "1000")

      const proposalState = await waitForProposalToBeActive(proposalId) // proposal id of the proposal in the beforeAll step & block when the proposal was created

      expect(proposalState.toString()).to.eql("1") // active

      const tx = await governor.connect(newVoter).castVote(proposalId, 1)
      const proposeReceipt = await tx.wait()
      const event = proposeReceipt?.logs[0]
      const decodedLogs = governor.interface.parseLog({
        topics: [...(event?.topics as string[])],
        data: event ? event.data : "",
      })

      //event exists
      expect(decodedLogs?.name).to.eql("VoteCast")
      // voter
      expect(decodedLogs?.args[0]).to.eql(await newVoter.getAddress())
      // proposal id
      expect(decodedLogs?.args[1]).to.eql(proposalId)
      // support
      expect(decodedLogs?.args[2].toString()).to.eql("1")
      // votes
      expect(decodedLogs?.args[3].toString()).to.eql("0") // weight 0 instead of 1000 because the snapshot was taken before the delegation
    })

    it("can count votes correctly", async function () {
      const { governor } = await getOrDeployContractInstances({ forceDeploy: false })

      const proposalState = await waitForProposalToBeActive(proposalId) // proposal id of the proposal in the beforeAll step & block when the proposal was created

      expect(proposalState.toString()).to.eql("1") // active

      //vote against
      await governor.connect(voter4).castVote(proposalId, 0)

      // now we should have the following votes:
      // voter1: 0 yes
      // voter2: 0 yes
      // voter3: 1000 yes
      // voter4: 9 no
      // abstain: 0
      const votes = await governor.proposalVotes(proposalId)

      // against votes
      expect(votes[0]).to.eql(ethers.parseEther("9"))

      // Note that if this test is ran in isolation, the following votes will be 0

      // for
      expect(votes[1]).to.satisfy((votes: bigint) => {
        return votes === ethers.parseEther("1000") || votes === BigInt(0)
      })

      // abstain
      expect(votes[2].toString()).to.eql("0")
    })

    it("cannot vote twice", async function () {
      const { governor } = await getOrDeployContractInstances({ forceDeploy: false })

      const proposalState = await waitForProposalToBeActive(proposalId) // proposal id of the proposal in the beforeAll step & block when the proposal was created

      expect(proposalState.toString()).to.eql("1") // active

      const hasVoted = await governor.hasVoted(proposalId, await voter3.getAddress())

      if (!hasVoted) await governor.connect(voter3).castVote(proposalId, 1)

      await catchRevert(governor.connect(voter3).castVote(proposalId, 1))
    })

    it("cannot vote after voting period ends", async function () {
      const { governor, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: false })

      let proposalState = await waitForProposalToBeActive(proposalId) // proposal id of the proposal in the beforeAll step & block when the proposal was created

      expect(proposalState.toString()).to.eql("1") // active

      const hasVoted = await governor.hasVoted(proposalId, await voter3.getAddress()) // voter3 has already voted to reach quorum otherwise the proposal would be defeated (state 3)

      if (!hasVoted) await governor.connect(voter3).castVote(proposalId, 1)

      await waitForVotingPeriodToEnd(proposalId)

      proposalState = await governor.state(proposalId)
      expect(proposalState.toString()).to.eql("4") // succeeded

      const voter5 = otherAccounts[5]
      await catchRevert(governor.connect(voter5).castVote(proposalId, 1))
    }).timeout(1800000)

    it("Stores that a user voted at least once", async function () {
      const { otherAccount, owner, governor, b3tr, B3trContract } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Start emissions
      await bootstrapAndStartEmissions()

      // Should be able to free mint after participating in allocation voting
      await participateInGovernanceVoting(
        otherAccount,
        owner,
        b3tr,
        B3trContract,
        description,
        functionToCall,
        [],
        false,
      )

      // Check if user voted
      const voted = await governor.hasVotedOnce(otherAccount.address)
      expect(voted).to.equal(true)
    })

    it("Quorum is calculated correctly", async function () {
      const { governor, otherAccounts, b3tr, B3trContract } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Start emissions
      await bootstrapAndStartEmissions()

      const voter = otherAccounts[0]
      const voter2 = otherAccounts[1]
      const voter3 = otherAccounts[2]
      await getVot3Tokens(voter, "1000")
      await getVot3Tokens(voter2, "1000")
      await getVot3Tokens(voter3, "1000")
      await waitForNextBlock()

      // Create a proposal
      const tx = await createProposal(
        b3tr,
        B3trContract,
        voter,
        description + ` ${this.test?.title}`,
        functionToCall,
        [],
        false,
      ) // Adding the test title to the description to make it unique otherwise it would revert due to proposal already exists

      const proposalId = await getProposalIdFromTx(tx)

      // wait
      await waitForProposalToBeActive(proposalId)

      // vote
      await governor.connect(voter).castVote(proposalId, 0) // vote agains
      await governor.connect(voter2).castVote(proposalId, 1) // vote for
      await governor.connect(voter3).castVote(proposalId, 2) // vote abastain

      // wait
      await waitForVotingPeriodToEnd(proposalId)

      const proposalSnapshot = await governor.proposalSnapshot(proposalId)

      const quorumNeeded = await governor.quorum(proposalSnapshot)

      const proposalVotes = await governor.proposalVotes(proposalId)
      //sum of votes
      const totalVotes = proposalVotes.reduce((a, b) => a + b, 0n)
      expect(totalVotes).to.eql(ethers.parseEther("3000"))
      expect(totalVotes).to.be.greaterThan(quorumNeeded)

      const isQuorumReached = await governor.quorumReached(proposalId)
      expect(isQuorumReached).to.equal(true)
    })

    it("Agaist votes are counted correctly for quorum", async function () {
      const { governor, otherAccounts, b3tr, B3trContract } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Start emissions
      await bootstrapAndStartEmissions()

      const voter = otherAccounts[0]
      const voter2 = otherAccounts[1]
      const voter3 = otherAccounts[2]
      await getVot3Tokens(voter, "1000")
      await getVot3Tokens(voter2, "1000")
      await getVot3Tokens(voter3, "1000")
      await waitForNextBlock()

      // Create a proposal
      const tx = await createProposal(
        b3tr,
        B3trContract,
        voter,
        description + ` ${this.test?.title}`,
        functionToCall,
        [],
        false,
      ) // Adding the test title to the description to make it unique otherwise it would revert due to proposal already exists

      const proposalId = await getProposalIdFromTx(tx)

      // wait
      await waitForProposalToBeActive(proposalId)

      // vote
      await governor.connect(voter).castVote(proposalId, 0) // vote against
      await governor.connect(voter2).castVote(proposalId, 0) // vote against

      // wait
      await waitForVotingPeriodToEnd(proposalId)

      // Check if quorum is calculated correctly
      const isQuorumReached = await governor.quorumReached(proposalId)
      expect(isQuorumReached).to.equal(true)
    })

    it("Abstain votes are counted correctly for quorum", async function () {
      const { governor, otherAccounts, b3tr, B3trContract } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Start emissions
      await bootstrapAndStartEmissions()

      const voter = otherAccounts[0]
      const voter2 = otherAccounts[1]
      const voter3 = otherAccounts[2]
      await getVot3Tokens(voter, "1000")
      await getVot3Tokens(voter2, "1000")
      await getVot3Tokens(voter3, "1000")
      await waitForNextBlock()

      // Create a proposal
      const tx = await createProposal(
        b3tr,
        B3trContract,
        voter,
        description + ` ${this.test?.title}`,
        functionToCall,
        [],
        false,
      ) // Adding the test title to the description to make it unique otherwise it would revert due to proposal already exists

      const proposalId = await getProposalIdFromTx(tx)

      // wait
      await waitForProposalToBeActive(proposalId)

      // vote
      await governor.connect(voter).castVote(proposalId, 2) // vote abstain
      await governor.connect(voter2).castVote(proposalId, 2) // vote abstain

      // wait
      await waitForVotingPeriodToEnd(proposalId)

      // Check if quorum is calculated correctly
      const isQuorumReached = await governor.quorumReached(proposalId)
      expect(isQuorumReached).to.equal(true)
    })

    it("Yes votes are counted correctly for quorum", async function () {
      const { governor, otherAccounts, b3tr, B3trContract } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Start emissions
      await bootstrapAndStartEmissions()

      const voter = otherAccounts[0]
      const voter2 = otherAccounts[1]
      const voter3 = otherAccounts[2]
      await getVot3Tokens(voter, "1000")
      await getVot3Tokens(voter2, "1000")
      await getVot3Tokens(voter3, "1000")
      await waitForNextBlock()

      // Create a proposal
      const tx = await createProposal(
        b3tr,
        B3trContract,
        voter,
        description + ` ${this.test?.title}`,
        functionToCall,
        [],
        false,
      ) // Adding the test title to the description to make it unique otherwise it would revert due to proposal already exists

      const proposalId = await getProposalIdFromTx(tx)

      // wait
      await waitForProposalToBeActive(proposalId)

      // vote
      await governor.connect(voter).castVote(proposalId, 1) // vote yes
      await governor.connect(voter2).castVote(proposalId, 1) // vote yes

      // wait
      await waitForVotingPeriodToEnd(proposalId)

      // Check if quorum is calculated correctly
      const isQuorumReached = await governor.quorumReached(proposalId)
      expect(isQuorumReached).to.equal(true)
    })
  })

  describe("Proposal Execution", function () {
    let proposalId: number
    let voter: HardhatEthersSigner

    const functionToCall = "tokenDetails"
    const description = "Get token details"

    this.beforeAll(async function () {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
      config.EMISSIONS_CYCLE_DURATION = 10
      const { otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      // Start emissions
      await bootstrapAndStartEmissions()

      // load votes
      voter = otherAccounts[0]
      await getVot3Tokens(voter, "1000")
      await waitForNextBlock()
    })

    it("cannot queue a proposal if not in succeeded state", async function () {
      const {
        governor,
        b3tr,
        B3trContract,
        otherAccount: proposer,
      } = await getOrDeployContractInstances({ forceDeploy: false })

      // create a new proposal
      const tx = await createProposal(
        b3tr,
        B3trContract,
        proposer,
        description + ` ${this.test?.title}`,
        functionToCall,
        [],
        false,
      ) // Adding the test title to the description to make it unique otherwise it would revert due to proposal already exists

      proposalId = await getProposalIdFromTx(tx)

      // wait
      await waitForProposalToBeActive(proposalId)

      // vote
      await governor.connect(voter).castVote(proposalId, 0) // vote against

      // wait
      await waitForVotingPeriodToEnd(proposalId)
      const proposalState = await governor.state(proposalId)
      expect(proposalState.toString()).to.eql("3") // defeated

      // try to queue
      const b3trAddress = await b3tr.getAddress()
      const encodedFunctionCall = B3trContract.interface.encodeFunctionData(functionToCall, [])
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description))
      await catchRevert(governor.queue([b3trAddress], [0], [encodedFunctionCall], descriptionHash))
    })

    it("cannot execute a proposal without queueing it to TimeLock first", async function () {
      const {
        governor,
        b3tr,
        B3trContract,
        otherAccount: proposer,
      } = await getOrDeployContractInstances({ forceDeploy: false })

      // create a new proposal
      const tx = await createProposal(
        b3tr,
        B3trContract,
        proposer,
        description + ` ${this.test?.title}`,
        functionToCall,
        [],
        false,
      ) // Adding the test title to the description to make it unique otherwise it would revert due to proposal already exists

      proposalId = await getProposalIdFromTx(tx)

      // wait
      await waitForProposalToBeActive(proposalId)

      // vote
      await governor.connect(voter).castVote(proposalId, 1) // vote for

      // wait
      await waitForVotingPeriodToEnd(proposalId)
      const proposalState = await governor.state(proposalId)
      expect(proposalState.toString()).to.eql("4") // succeded

      // try to execute
      const b3trAddress = await b3tr.getAddress()
      const encodedFunctionCall = B3trContract.interface.encodeFunctionData(functionToCall, [])
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description))
      await catchRevert(governor.execute([b3trAddress], [0], [encodedFunctionCall], descriptionHash))
    })

    it("can correctly queue proposal if vote succeeded", async function () {
      const {
        governor,
        b3tr,
        B3trContract,
        otherAccount: proposer,
      } = await getOrDeployContractInstances({ forceDeploy: false })

      // create a new proposal
      const tx = await createProposal(
        b3tr,
        B3trContract,
        proposer,
        description + ` ${this.test?.title}`,
        functionToCall,
        [],
        false,
      ) // Adding the test title to the description to make it unique otherwise it would revert due to proposal already exists

      proposalId = await getProposalIdFromTx(tx)

      // wait
      await waitForProposalToBeActive(proposalId)

      // vote
      await governor.connect(voter).castVote(proposalId, 1) // vote for

      // wait
      await waitForVotingPeriodToEnd(proposalId)
      let proposalState = await governor.state(proposalId)
      expect(proposalState.toString()).to.eql("4") // succeded

      // queue it
      const b3trAddress = await b3tr.getAddress()
      const encodedFunctionCall = B3trContract.interface.encodeFunctionData(functionToCall, [])
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description + ` ${this.test?.title}`))

      await governor.queue([b3trAddress], [0], [encodedFunctionCall], descriptionHash)

      // proposal should be in queued state
      proposalState = await governor.state(proposalId)
      expect(proposalState.toString()).to.eql("5")
    })

    // this test needs the previous one to be run first
    it("can correctly execute proposal after it was queued", async function () {
      const {
        governor,
        b3tr,
        B3trContract,
        otherAccount: proposer,
      } = await getOrDeployContractInstances({ forceDeploy: false })

      // create a new proposal
      const tx = await createProposal(
        b3tr,
        B3trContract,
        proposer,
        description + ` ${this.test?.title}`,
        functionToCall,
        [],
        false,
      ) // Adding the test title to the description to make it unique otherwise it would revert due to proposal already exists

      proposalId = await getProposalIdFromTx(tx)

      // wait
      await waitForProposalToBeActive(proposalId)

      // vote
      await governor.connect(voter).castVote(proposalId, 1) // vote for

      // wait
      await waitForVotingPeriodToEnd(proposalId)
      let proposalState = await governor.state(proposalId)
      expect(proposalState.toString()).to.eql("4") // succeded

      // queue it
      const b3trAddress = await b3tr.getAddress()
      const encodedFunctionCall = B3trContract.interface.encodeFunctionData(functionToCall, [])
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description + ` ${this.test?.title}`))

      await governor.queue([b3trAddress], [0], [encodedFunctionCall], descriptionHash)

      // proposal should be in queued state
      proposalState = await governor.state(proposalId)
      expect(proposalState.toString()).to.eql("5")

      await governor.execute([b3trAddress], [0], [encodedFunctionCall], descriptionHash)

      // proposal should be in executed state
      proposalState = await governor.state(proposalId)
      expect(proposalState.toString()).to.eql("7")
    })

    it("cannot execute proposal twice", async function () {
      const {
        governor,
        b3tr,
        B3trContract,
        otherAccount: proposer,
      } = await getOrDeployContractInstances({ forceDeploy: false })

      // create a new proposal
      const tx = await createProposal(
        b3tr,
        B3trContract,
        proposer,
        description + ` ${this.test?.title}`,
        functionToCall,
        [],
        false,
      ) // Adding the test title to the description to make it unique otherwise it would revert due to proposal already exists

      proposalId = await getProposalIdFromTx(tx)

      // wait
      await waitForProposalToBeActive(proposalId)

      // vote
      await governor.connect(voter).castVote(proposalId, 1) // vote for

      // wait
      await waitForVotingPeriodToEnd(proposalId)
      let proposalState = await governor.state(proposalId)
      expect(proposalState.toString()).to.eql("4") // succeded

      // queue it
      const b3trAddress = await b3tr.getAddress()
      const encodedFunctionCall = B3trContract.interface.encodeFunctionData(functionToCall, [])
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description + ` ${this.test?.title}`))

      await governor.queue([b3trAddress], [0], [encodedFunctionCall], descriptionHash)

      // proposal should be in queued state
      proposalState = await governor.state(proposalId)
      expect(proposalState.toString()).to.eql("5")

      await governor.execute([b3trAddress], [0], [encodedFunctionCall], descriptionHash)

      // proposal should be in executed state
      proposalState = await governor.state(proposalId)
      expect(proposalState.toString()).to.eql("7")

      // try to execute again
      await catchRevert(governor.execute([b3trAddress], [0], [encodedFunctionCall], descriptionHash))
    })
  })

  describe("Proposal Cancellation", function () {
    const functionToCall = "tokenDetails"
    const description = "Get token details"
    let proposalId: any

    it("cannot cancel a proposal if not in pending state", async function () {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
      config.EMISSIONS_CYCLE_DURATION = 10
      const {
        governor,
        b3tr,
        B3trContract,
        otherAccount: proposer,
      } = await getOrDeployContractInstances({ forceDeploy: false, config })

      // create a new proposal
      const tx = await createProposal(
        b3tr,
        B3trContract,
        proposer,
        description + ` ${this.test?.title}`,
        functionToCall,
        [],
        false,
      ) // Adding the test title to the description to make it unique otherwise it would revert due to proposal already exists

      proposalId = await getProposalIdFromTx(tx)

      // wait
      await waitForProposalToBeActive(proposalId)

      const proposalState = await governor.state(proposalId)
      expect(proposalState.toString()).to.eql("1") // active

      const encodedFunctionCall = B3trContract.interface.encodeFunctionData("tokenDetails", [])
      // try to cancel
      await catchRevert(
        governor.cancel(
          [await b3tr.getAddress()],
          [0],
          [encodedFunctionCall],
          ethers.keccak256(ethers.toUtf8Bytes(`${description} ${this.test?.title}`)),
        ),
      )
    })
    it("cannot cancel a proposal if not admin or proposer", async function () {
      const {
        governor,
        b3tr,
        B3trContract,
        otherAccount: proposer,
        otherAccounts,
      } = await getOrDeployContractInstances({ forceDeploy: false })

      // create a new proposal
      const tx = await createProposal(
        b3tr,
        B3trContract,
        proposer,
        description + ` ${this.test?.title}`,
        functionToCall,
        [],
        false,
      ) // Adding the test title to the description to make it unique otherwise it would revert due to proposal already exists

      proposalId = await getProposalIdFromTx(tx)

      const proposalState = await governor.state(proposalId)
      expect(proposalState.toString()).to.eql("0") // pending

      const encodedFunctionCall = B3trContract.interface.encodeFunctionData("tokenDetails", [])
      // try to cancel
      await catchRevert(
        governor
          .connect(otherAccounts[3])
          .cancel(
            [await b3tr.getAddress()],
            [0],
            [encodedFunctionCall],
            ethers.keccak256(ethers.toUtf8Bytes(`${description} ${this.test?.title}`)),
          ),
      )
    })
    it("can cancel a proposal if admin", async function () {
      const {
        governor,
        b3tr,
        B3trContract,
        owner,
        otherAccount: proposer,
      } = await getOrDeployContractInstances({ forceDeploy: true })

      await bootstrapAndStartEmissions()

      const tx = await createProposal(
        b3tr,
        B3trContract,
        proposer,
        description + ` ${this.test?.title}`,
        functionToCall,
        [],
        false,
      )

      proposalId = await getProposalIdFromTx(tx)

      const proposalState1 = await governor.state(proposalId)
      expect(proposalState1.toString()).to.eql("0") // pending

      const encodedFunctionCall = B3trContract.interface.encodeFunctionData(functionToCall, [])

      // try to cancel
      await governor
        .connect(owner)
        .cancel(
          [await b3tr.getAddress()],
          [0],
          [encodedFunctionCall],
          ethers.keccak256(ethers.toUtf8Bytes(`${description} ${this.test?.title}`)),
        )
      const proposalState2 = await governor.state(proposalId)
      expect(proposalState2.toString()).to.eql("2") // cancelled
    })
    it("can cancel a proposal if proposer", async function () {
      const {
        governor,
        b3tr,
        B3trContract,
        otherAccount: proposer,
      } = await getOrDeployContractInstances({ forceDeploy: true })

      await bootstrapAndStartEmissions()

      const tx = await createProposal(
        b3tr,
        B3trContract,
        proposer,
        description + ` ${this.test?.title}`,
        functionToCall,
        [],
        false,
      )

      proposalId = await getProposalIdFromTx(tx)

      const proposalState1 = await governor.state(proposalId)
      expect(proposalState1.toString()).to.eql("0") // pending

      const encodedFunctionCall = B3trContract.interface.encodeFunctionData("tokenDetails", [])
      // try to cancel
      await governor
        .connect(proposer)
        .cancel(
          [await b3tr.getAddress()],
          [0],
          [encodedFunctionCall],
          ethers.keccak256(ethers.toUtf8Bytes(`${description} ${this.test?.title}`)),
        )
      const proposalState2 = await governor.state(proposalId)
      expect(proposalState2.toString()).to.eql("2") // cancelled
    })
  })
})
