import { expect } from "chai"
import { ethers } from "hardhat"
import { describe, it } from "mocha"

import { B3TR, B3TRGovernor, Emissions, VeBetterPassport, VOT3, XAllocationVoting } from "../../typechain-types"
import { createProposal, getProposalIdFromTx, getVot3Tokens, waitForCurrentRoundToEnd } from "../helpers/common"
import {
  setupGovernanceFixtureWithEmissions,
  setupProposer,
  setupSupporter,
  setupVoter,
  startNewRoundAndGetRoundId,
} from "./fixture.test"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { ContractFactory } from "ethers"

describe.only("Governance - V8 Compatibility - @shard4h", function () {
  let governor: B3TRGovernor
  let vot3: VOT3
  let b3tr: B3TR
  let b3trContract: ContractFactory
  let minterAccount: SignerWithAddress
  let proposer: SignerWithAddress
  let owner: SignerWithAddress
  let emissions: Emissions
  let otherAccounts: SignerWithAddress[]
  let veBetterPassport: VeBetterPassport
  let xAllocationVoting: XAllocationVoting
  beforeEach(async function () {
    const fixture = await setupGovernanceFixtureWithEmissions()
    governor = fixture.governor
    vot3 = fixture.vot3
    b3tr = fixture.b3tr
    b3trContract = fixture.b3trContract
    minterAccount = fixture.minterAccount
    proposer = fixture.proposer
    owner = fixture.owner
    otherAccounts = fixture.otherAccounts
    emissions = fixture.emissions
    veBetterPassport = fixture.veBetterPassport
    xAllocationVoting = fixture.xAllocationVoting
    // Setup proposer for all tests
    await emissions.connect(minterAccount).start()
    await setupProposer(proposer, b3tr, vot3, minterAccount)

    // Setup voters for all tests
    await setupVoter(otherAccounts[0], b3tr, vot3, minterAccount, owner, veBetterPassport)
    await setupVoter(otherAccounts[1], b3tr, vot3, minterAccount, owner, veBetterPassport)
    await setupVoter(otherAccounts[2], b3tr, vot3, minterAccount, owner, veBetterPassport)
    await setupVoter(otherAccounts[3], b3tr, vot3, minterAccount, owner, veBetterPassport)
  })

  describe("Governance - V8 Compatibility - Cancellability", function () {
    it("Proposals in SUPPORT PHASE should be cancellable in V8", async () => {
      const functionToCall = "tokenDetails"
      const encodedFunctionCall = b3trContract.interface.encodeFunctionData(functionToCall, [])
      // Create a proposal using the old method (propose)
      const tx = await createProposal(b3tr, b3trContract, proposer, `description ${this.title}`, functionToCall, [])

      const proposalId = await getProposalIdFromTx(tx)

      const stateBeforeCancel = await governor.state(proposalId)
      expect(stateBeforeCancel).to.equal(0) // pending

      await governor
        .connect(proposer)
        .cancel(
          [await b3tr.getAddress()],
          [0],
          [encodedFunctionCall],
          ethers.keccak256(ethers.toUtf8Bytes(`description ${this.title}`)),
        )
      const stateAfterCancel = await governor.state(proposalId)
      expect(stateAfterCancel).to.equal(2) // cancelled
    })

    it("Proposals in VOTING PHASE should be cancellable only by admin in V8", async () => {
      const functionToCall = "tokenDetails"
      const encodedFunctionCall = b3trContract.interface.encodeFunctionData(functionToCall, [])
      // Create a proposal using the old method (propose)
      const tx = await createProposal(
        b3tr,
        b3trContract,
        otherAccounts[2],
        `description ${this.title}`,
        functionToCall,
        [],
      )

      const proposalId = await getProposalIdFromTx(tx)

      const proposalThreshold = await governor.proposalDepositThreshold(proposalId)
      await setupSupporter(otherAccounts[3], vot3, proposalThreshold, governor)
      await governor.connect(otherAccounts[3]).deposit(proposalThreshold, proposalId, { gasLimit: 10_000_000 })

      await waitForCurrentRoundToEnd({ emissions, xAllocationVoting })

      await startNewRoundAndGetRoundId(emissions, xAllocationVoting)

      const stateBeforeCancel = await governor.state(proposalId)
      expect(stateBeforeCancel).to.equal(1) // active

      await expect(
        governor
          .connect(otherAccounts[2])
          .cancel(
            [await b3tr.getAddress()],
            [0],
            [encodedFunctionCall],
            ethers.keccak256(ethers.toUtf8Bytes(`description ${this.title}`)),
          ),
      ).to.be.reverted

      const stateAfterCancel = await governor.state(proposalId)
      expect(stateAfterCancel).to.equal(stateBeforeCancel) // cancelled

      //Now we should be able to cancel the proposal with the admin
      await governor
        .connect(owner)
        .cancel(
          [await b3tr.getAddress()],
          [0],
          [encodedFunctionCall],
          ethers.keccak256(ethers.toUtf8Bytes(`description ${this.title}`)),
        )
      const stateAfterCancelAdmin = await governor.state(proposalId)
      expect(stateAfterCancelAdmin).to.equal(2) // cancelled
    })

    it("Proposals in QUEUED state should be cancellable only by admin in V8", async () => {
      const functionToCall = "tokenDetails"
      const encodedFunctionCall = b3trContract.interface.encodeFunctionData(functionToCall, [])
      // Create a proposal using the old method (propose)
      const tx = await createProposal(b3tr, b3trContract, proposer, `description ${this.title}`, functionToCall, [])

      const proposalId = await getProposalIdFromTx(tx)

      const proposalThreshold = await governor.proposalDepositThreshold(proposalId)
      await setupSupporter(otherAccounts[3], vot3, proposalThreshold, governor)
      await governor.connect(otherAccounts[3]).deposit(proposalThreshold, proposalId, { gasLimit: 10_000_000 })

      //Start voting round
      await waitForCurrentRoundToEnd({ emissions, xAllocationVoting })
      await startNewRoundAndGetRoundId(emissions, xAllocationVoting)

      //Vote for the proposal
      await governor.connect(otherAccounts[0]).castVote(proposalId, 1)
      await governor.connect(otherAccounts[1]).castVote(proposalId, 1)
      await governor.connect(otherAccounts[2]).castVote(proposalId, 1)

      //Start queue/execution round
      await waitForCurrentRoundToEnd({ emissions, xAllocationVoting })
      await startNewRoundAndGetRoundId(emissions, xAllocationVoting)

      //Queue the proposal
      await governor.queue(
        [await b3tr.getAddress()],
        [0],
        [encodedFunctionCall],
        ethers.keccak256(ethers.toUtf8Bytes(`description ${this.title}`)),
      )

      //Proposal should be in queued state
      const stateBeforeCancel = await governor.state(proposalId)
      expect(stateBeforeCancel).to.equal(5) // queued

      //Proposer should NOT be able to cancel the proposal in queued state
      await expect(
        governor
          .connect(proposer)
          .cancel(
            [await b3tr.getAddress()],
            [0],
            [encodedFunctionCall],
            ethers.keccak256(ethers.toUtf8Bytes(`description ${this.title}`)),
          ),
      ).to.be.reverted

      //Now we should be able to cancel the proposal with the admin
      await governor
        .connect(owner)
        .cancel(
          [await b3tr.getAddress()],
          [0],
          [encodedFunctionCall],
          ethers.keccak256(ethers.toUtf8Bytes(`description ${this.title}`)),
        )
      const stateAfterCancelAdmin = await governor.state(proposalId)
      expect(stateAfterCancelAdmin).to.equal(2) // cancelled
    })

    it("Proposals in EXECUTED state should NOT be cancellable in V8", async () => {
      const functionToCall = "tokenDetails"
      const encodedFunctionCall = b3trContract.interface.encodeFunctionData(functionToCall, [])
      // Create a proposal using the old method (propose)
      const tx = await createProposal(b3tr, b3trContract, proposer, `description ${this.title}`, functionToCall, [])

      const proposalId = await getProposalIdFromTx(tx)

      const proposalThreshold = await governor.proposalDepositThreshold(proposalId)
      await setupSupporter(otherAccounts[3], vot3, proposalThreshold, governor)
      await governor.connect(otherAccounts[3]).deposit(proposalThreshold, proposalId, { gasLimit: 10_000_000 })

      //Start voting round
      await waitForCurrentRoundToEnd({ emissions, xAllocationVoting })
      await startNewRoundAndGetRoundId(emissions, xAllocationVoting)

      //Vote for the proposal
      await governor.connect(otherAccounts[0]).castVote(proposalId, 1)
      await governor.connect(otherAccounts[1]).castVote(proposalId, 1)
      await governor.connect(otherAccounts[2]).castVote(proposalId, 1)

      //Start queue/execution round
      await waitForCurrentRoundToEnd({ emissions, xAllocationVoting })
      await startNewRoundAndGetRoundId(emissions, xAllocationVoting)

      //Queue the proposal
      await governor.queue(
        [await b3tr.getAddress()],
        [0],
        [encodedFunctionCall],
        ethers.keccak256(ethers.toUtf8Bytes(`description ${this.title}`)),
      )

      //Execute the proposal
      await governor.execute(
        [await b3tr.getAddress()],
        [0],
        [encodedFunctionCall],
        ethers.keccak256(ethers.toUtf8Bytes(`description ${this.title}`)),
      )

      //Proposal should be in executed state
      const stateBeforeCancel = await governor.state(proposalId)
      expect(stateBeforeCancel).to.equal(6) // executed

      //Proposer should NOT be able to cancel the proposal in executed state
      await expect(
        governor
          .connect(proposer)
          .cancel(
            [await b3tr.getAddress()],
            [0],
            [encodedFunctionCall],
            ethers.keccak256(ethers.toUtf8Bytes(`description ${this.title}`)),
          ),
      ).to.be.reverted

      //Admin also should NOT be able to cancel the proposal in executed state
      await expect(
        governor
          .connect(owner)
          .cancel(
            [await b3tr.getAddress()],
            [0],
            [encodedFunctionCall],
            ethers.keccak256(ethers.toUtf8Bytes(`description ${this.title}`)),
          ),
      ).to.be.reverted

      //State should remain in executed state
      const stateAfterCancel = await governor.state(proposalId)
      expect(stateAfterCancel).to.equal(stateBeforeCancel) // executed
    })

    it("Proposals in IN DEVELOPMENT state should NOT be cancellable in V8", async () => {
      const functionToCall = "tokenDetails"
      const encodedFunctionCall = b3trContract.interface.encodeFunctionData(functionToCall, [])
      // Create a proposal using the old method (propose)
      const tx = await createProposal(b3tr, b3trContract, proposer, `description ${this.title}`, functionToCall, [])

      const proposalId = await getProposalIdFromTx(tx)

      const proposalThreshold = await governor.proposalDepositThreshold(proposalId)
      await setupSupporter(otherAccounts[3], vot3, proposalThreshold, governor)
      await governor.connect(otherAccounts[3]).deposit(proposalThreshold, proposalId, { gasLimit: 10_000_000 })

      //Start voting round
      await waitForCurrentRoundToEnd({ emissions, xAllocationVoting })
      await startNewRoundAndGetRoundId(emissions, xAllocationVoting)

      //Vote for the proposal
      await governor.connect(otherAccounts[0]).castVote(proposalId, 1)
      await governor.connect(otherAccounts[1]).castVote(proposalId, 1)
      await governor.connect(otherAccounts[2]).castVote(proposalId, 1)

      //Start queue/execution round
      await waitForCurrentRoundToEnd({ emissions, xAllocationVoting })
      await startNewRoundAndGetRoundId(emissions, xAllocationVoting)

      //Queue the proposal
      await governor.queue(
        [await b3tr.getAddress()],
        [0],
        [encodedFunctionCall],
        ethers.keccak256(ethers.toUtf8Bytes(`description ${this.title}`)),
      )

      //Execute the proposal
      await governor.execute(
        [await b3tr.getAddress()],
        [0],
        [encodedFunctionCall],
        ethers.keccak256(ethers.toUtf8Bytes(`description ${this.title}`)),
      )

      //Mark the proposal as in development
      await governor.markAsInDevelopment(proposalId)

      //Proposal should be in in development state
      const stateBeforeCancel = await governor.state(proposalId)
      expect(stateBeforeCancel).to.equal(8) // in development

      //Proposer should NOT be able to cancel the proposal in in development state
      await expect(
        governor
          .connect(proposer)
          .cancel(
            [await b3tr.getAddress()],
            [0],
            [encodedFunctionCall],
            ethers.keccak256(ethers.toUtf8Bytes(`description ${this.title}`)),
          ),
      ).to.be.reverted

      //Admin also should NOT be able to cancel the proposal in in development state
      await expect(
        governor
          .connect(owner)
          .cancel(
            [await b3tr.getAddress()],
            [0],
            [encodedFunctionCall],
            ethers.keccak256(ethers.toUtf8Bytes(`description ${this.title}`)),
          ),
      ).to.be.reverted

      //State should remain in in development state
      const stateAfterCancel = await governor.state(proposalId)
      expect(stateAfterCancel).to.equal(stateBeforeCancel) // in development
    })

    it("Proposals in COMPLETED state should NOT be cancellable in V8", async () => {
      const functionToCall = "tokenDetails"
      const encodedFunctionCall = b3trContract.interface.encodeFunctionData(functionToCall, [])
      // Create a proposal using the old method (propose)
      const tx = await createProposal(b3tr, b3trContract, proposer, `description ${this.title}`, functionToCall, [])

      const proposalId = await getProposalIdFromTx(tx)

      const proposalThreshold = await governor.proposalDepositThreshold(proposalId)
      await setupSupporter(otherAccounts[3], vot3, proposalThreshold, governor)
      await governor.connect(otherAccounts[3]).deposit(proposalThreshold, proposalId, { gasLimit: 10_000_000 })

      //Start voting round
      await waitForCurrentRoundToEnd({ emissions, xAllocationVoting })
      await startNewRoundAndGetRoundId(emissions, xAllocationVoting)

      //Vote for the proposal
      await governor.connect(otherAccounts[0]).castVote(proposalId, 1)
      await governor.connect(otherAccounts[1]).castVote(proposalId, 1)
      await governor.connect(otherAccounts[2]).castVote(proposalId, 1)

      //Start queue/execution round
      await waitForCurrentRoundToEnd({ emissions, xAllocationVoting })
      await startNewRoundAndGetRoundId(emissions, xAllocationVoting)

      //Queue the proposal
      await governor.queue(
        [await b3tr.getAddress()],
        [0],
        [encodedFunctionCall],
        ethers.keccak256(ethers.toUtf8Bytes(`description ${this.title}`)),
      )

      //Execute the proposal
      await governor.execute(
        [await b3tr.getAddress()],
        [0],
        [encodedFunctionCall],
        ethers.keccak256(ethers.toUtf8Bytes(`description ${this.title}`)),
      )

      //Mark the proposal as in development
      await governor.markAsInDevelopment(proposalId)

      //Mark the proposal as completed
      await governor.markAsCompleted(proposalId)

      //Proposal should be in completed state
      const stateBeforeCancel = await governor.state(proposalId)
      expect(stateBeforeCancel).to.equal(9) // completed

      //Proposer should NOT be able to cancel the proposal in completed state
      await expect(
        governor
          .connect(proposer)
          .cancel(
            [await b3tr.getAddress()],
            [0],
            [encodedFunctionCall],
            ethers.keccak256(ethers.toUtf8Bytes(`description ${this.title}`)),
          ),
      ).to.be.reverted

      //Admin also should NOT be able to cancel the proposal in completed state
      await expect(
        governor
          .connect(owner)
          .cancel(
            [await b3tr.getAddress()],
            [0],
            [encodedFunctionCall],
            ethers.keccak256(ethers.toUtf8Bytes(`description ${this.title}`)),
          ),
      ).to.be.reverted

      //State should remain in completed state
      const stateAfterCancel = await governor.state(proposalId)
      expect(stateAfterCancel).to.equal(stateBeforeCancel) // completed
    })
  })
})
