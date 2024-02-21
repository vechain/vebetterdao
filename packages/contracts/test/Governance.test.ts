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
} from "./helpers"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { describe, it } from "mocha"
import { createLocalConfig } from "@repo/config/contracts/envs/local"

describe("Governor and TimeLock", function () {
  const description = "Test Proposal: testing propsal with random description!"
  const functionToCall = "tokenDetails"
  let proposalId: number = 0

  describe("Governor deployment", function () {
    it("should set constructors correctly", async function () {
      const config = createLocalConfig()
      const { governor, vot3, owner, timeLock } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      const votesThreshold = (await governor.proposalThreshold()).toString()
      const votingPeriod = (await governor.votingPeriod()).toString()

      expect(votesThreshold).to.eql(config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD.toString())
      expect(votingPeriod).to.eql(config.B3TR_GOVERNOR_VOTING_PERIOD.toString())

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
  })

  describe("Proposal Creation", function () {
    it("cannot create a proposal if NOT a VOT3 holder", async function () {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
      const { governor, B3trContract, b3tr, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })
      await catchRevert(createProposal(governor, b3tr, B3trContract, owner, description, functionToCall, [], true))
    })

    it("can create a proposal even if user did not manually self delegated (because of automatic self-delegation)", async function () {
      const { governor, B3trContract, vot3, b3tr, owner, minterAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Before creating a proposal, we need to mint some VOT3 tokens to the owner
      await b3tr.connect(minterAccount).mint(owner, ethers.parseEther("1000"))
      await b3tr.connect(owner).approve(await vot3.getAddress(), ethers.parseEther("9"))
      await vot3.connect(owner).stake(ethers.parseEther("9"), { gasLimit: 10_000_000 })

      await createProposal(governor, b3tr, B3trContract, owner, description, functionToCall, [], true)
    })

    it("can create a proposal if VOT3 holder that self-delegated", async function () {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
      const { governor, B3trContract, b3tr, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      // Now we can create a proposal
      const tx = await createProposal(governor, b3tr, B3trContract, owner, description, functionToCall, [])
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
      proposalId = decodedLogs?.args[0]
      expect(proposalId).not.to.be.null
      // proposer is the owner
      expect(decodedLogs?.args[1]).to.eql(await owner.getAddress())
      // targets are correct
      const b3trAddress = await b3tr.getAddress()
      expect(decodedLogs?.args[2]).to.eql([b3trAddress])
      // values are correct
      expect(decodedLogs?.args[3].toString()).to.eql("0")
      // calldatas are correct
      const encodedFunctionCall = B3trContract.interface.encodeFunctionData(functionToCall, [])
      expect(decodedLogs?.args[5]).to.eql([encodedFunctionCall])
      // description is correct
      expect(decodedLogs?.args[8]).to.eql(description)
      // block when proposal will start
      const voteStart = decodedLogs?.args[6]
      expect(voteStart).not.to.be.null
      // block when proposal will end
      const voteEnd = decodedLogs?.args[7]
      expect(voteEnd).not.to.be.null
      expect(voteEnd).to.eql(voteStart + BigInt(config.B3TR_GOVERNOR_VOTING_PERIOD))

      // proposal should be in pending state
      const proposalState = await governor.state(proposalId)

      /* 
             Note: the enum ProposalState is defined as follows:
             
             enum ProposalState {
                Pending,
                Active,
                Canceled,
                Defeated,
                Succeeded,
                Queued,
                Expired,
                Executed
             }
             */
      expect(proposalState.toString()).to.eql("0") // pending
    })

    it("can calculate the proposal id from the proposal parameters", async function () {
      const { governor, B3trContract, b3tr } = await getOrDeployContractInstances({ forceDeploy: false })

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
      const { governor, B3trContract, otherAccount, b3tr } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      // Now we can create a proposal
      await createProposal(governor, b3tr, B3trContract, otherAccount, description, functionToCall, [])
    })
  })

  // the tests described in this section cannot be run in isolation, but need to run in cascade
  describe("Proposal Voting", function () {
    let voter1: HardhatEthersSigner
    let voter2: HardhatEthersSigner
    let voter3: HardhatEthersSigner
    let voter4: HardhatEthersSigner

    this.beforeAll(async function () {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
      const { vot3, b3tr, otherAccounts, minterAccount, governor, B3trContract, otherAccount } =
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

      // Now we can create a new proposal
      const tx = await createProposal(governor, b3tr, B3trContract, otherAccount, description, functionToCall, [])
      proposalId = await getProposalIdFromTx(tx, governor)
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

      const proposalState = await waitForProposalToBeActive(proposalId, governor) // proposal id of the proposal in the beforeAll step & block when the proposal was created

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

      const proposalState = await waitForProposalToBeActive(proposalId, governor) // proposal id of the proposal in the beforeAll step & block when the proposal was created

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

      const proposalState = await waitForProposalToBeActive(proposalId, governor) // proposal id of the proposal in the beforeAll step & block when the proposal was created

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

      const proposalState = await waitForProposalToBeActive(proposalId, governor) // proposal id of the proposal in the beforeAll step & block when the proposal was created

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

      const proposalState = await waitForProposalToBeActive(proposalId, governor) // proposal id of the proposal in the beforeAll step & block when the proposal was created

      expect(proposalState.toString()).to.eql("1") // active

      const hasVoted = await governor.hasVoted(proposalId, await voter3.getAddress())

      if (!hasVoted) await governor.connect(voter3).castVote(proposalId, 1)

      await catchRevert(governor.connect(voter3).castVote(proposalId, 1))
    })

    it("cannot vote after voting period ends", async function () {
      const { governor, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: false })

      let proposalState = await waitForProposalToBeActive(proposalId, governor) // proposal id of the proposal in the beforeAll step & block when the proposal was created

      expect(proposalState.toString()).to.eql("1") // active

      const hasVoted = await governor.hasVoted(proposalId, await voter3.getAddress()) // voter3 has already voted to reach quorum otherwise the proposal would be defeated (state 3)

      if (!hasVoted) await governor.connect(voter3).castVote(proposalId, 1)

      await waitForVotingPeriodToEnd(proposalId, governor)

      proposalState = await governor.state(proposalId)
      expect(proposalState.toString()).to.eql("4") // succeeded

      const voter5 = otherAccounts[5]
      await catchRevert(governor.connect(voter5).castVote(proposalId, 1))
    }).timeout(1800000)

    it("Stores that a user voted at least once", async function () {
      const { otherAccount, owner, governor, b3tr, B3trContract } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Should be able to free mint after participating in allocation voting
      await participateInGovernanceVoting(
        otherAccount,
        owner,
        governor,
        b3tr,
        B3trContract,
        description,
        functionToCall,
        [],
      )

      // Check if user voted
      const voted = await governor.hasVotedOnce(otherAccount.address)
      expect(voted).to.equal(true)
    })
  })

  describe("Proposal Execution", function () {
    let proposalId: number
    let voter: HardhatEthersSigner

    this.beforeAll(async function () {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD = 1
      config.B3TR_GOVERNOR_VOTING_PERIOD = 3
      const { otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

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
        governor,
        b3tr,
        B3trContract,
        proposer,
        description + ` ${this.test?.title}`,
        functionToCall,
        [],
      ) // Adding the test title to the description to make it unique otherwise it would revert due to proposal already exists

      proposalId = await getProposalIdFromTx(tx, governor)

      // wait
      await waitForProposalToBeActive(proposalId, governor)

      // vote
      await governor.connect(voter).castVote(proposalId, 0) // vote against

      // wait
      await waitForVotingPeriodToEnd(proposalId, governor)
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
        governor,
        b3tr,
        B3trContract,
        proposer,
        description + ` ${this.test?.title}`,
        functionToCall,
        [],
      ) // Adding the test title to the description to make it unique otherwise it would revert due to proposal already exists

      proposalId = await getProposalIdFromTx(tx, governor)

      // wait
      await waitForProposalToBeActive(proposalId, governor)

      // vote
      await governor.connect(voter).castVote(proposalId, 1) // vote for

      // wait
      await waitForVotingPeriodToEnd(proposalId, governor)
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
        governor,
        b3tr,
        B3trContract,
        proposer,
        description + ` ${this.test?.title}`,
        functionToCall,
        [],
      ) // Adding the test title to the description to make it unique otherwise it would revert due to proposal already exists

      proposalId = await getProposalIdFromTx(tx, governor)

      // wait
      await waitForProposalToBeActive(proposalId, governor)

      // vote
      await governor.connect(voter).castVote(proposalId, 1) // vote for

      // wait
      await waitForVotingPeriodToEnd(proposalId, governor)
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
        governor,
        b3tr,
        B3trContract,
        proposer,
        description + ` ${this.test?.title}`,
        functionToCall,
        [],
      ) // Adding the test title to the description to make it unique otherwise it would revert due to proposal already exists

      proposalId = await getProposalIdFromTx(tx, governor)

      // wait
      await waitForProposalToBeActive(proposalId, governor)

      // vote
      await governor.connect(voter).castVote(proposalId, 1) // vote for

      // wait
      await waitForVotingPeriodToEnd(proposalId, governor)
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
        governor,
        b3tr,
        B3trContract,
        proposer,
        description + ` ${this.test?.title}`,
        functionToCall,
        [],
      ) // Adding the test title to the description to make it unique otherwise it would revert due to proposal already exists

      proposalId = await getProposalIdFromTx(tx, governor)

      // wait
      await waitForProposalToBeActive(proposalId, governor)

      // vote
      await governor.connect(voter).castVote(proposalId, 1) // vote for

      // wait
      await waitForVotingPeriodToEnd(proposalId, governor)
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
})
