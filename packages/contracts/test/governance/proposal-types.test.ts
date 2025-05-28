import { describe, it, beforeEach } from "mocha"
import { expect } from "chai"
import { setupGovernanceFixture } from "./fixture.test"
import { B3TRGovernor, VOT3, B3TR } from "../../typechain-types"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { ContractFactory } from "ethers"
import {
  bootstrapAndStartEmissions,
  createProposal,
  createProposalWithType,
  getProposalIdFromTx,
  waitForBlock,
} from "../helpers/common"
import { ethers } from "hardhat"

describe.only("Governance (Proposal Types) - @shard4a", function () {
  let governor: B3TRGovernor
  let vot3: VOT3
  let b3tr: B3TR
  let otherAccounts: SignerWithAddress[]
  let b3trContract: ContractFactory
  let minterAccount: SignerWithAddress
  let proposer: SignerWithAddress

  beforeEach(async function () {
    const fixture = await setupGovernanceFixture()
    governor = fixture.governor
    vot3 = fixture.vot3
    b3tr = fixture.b3tr
    otherAccounts = fixture.otherAccounts
    b3trContract = fixture.b3trContract
    minterAccount = fixture.minterAccount
    proposer = fixture.proposer
  })

  async function setupProposer(account: SignerWithAddress) {
    await b3tr.connect(minterAccount).mint(account, ethers.parseEther("1000"))
    await b3tr.connect(account).approve(await vot3.getAddress(), ethers.parseEther("9"))
    await vot3.connect(account).convertToVOT3(ethers.parseEther("9"), { gasLimit: 10_000_000 })
  }

  async function validateProposalEvents(
    receipt: any,
    expectedType: number,
    proposerAddress: string,
    description: string,
  ) {
    expect(receipt).not.to.be.null

    const proposalCreatedEvent = receipt?.logs[0]
    const proposalCreatedWithTypeEvent = receipt?.logs[1]

    expect(proposalCreatedEvent).not.to.be.undefined
    expect(proposalCreatedWithTypeEvent).not.to.be.undefined

    const decodedProposalCreatedEvent = governor.interface.parseLog({
      topics: [...(proposalCreatedEvent?.topics as string[])],
      data: proposalCreatedEvent ? proposalCreatedEvent.data : "",
    })

    const decodedProposalCreatedWithTypeEvent = governor.interface.parseLog({
      topics: [...(proposalCreatedWithTypeEvent?.topics as string[])],
      data: proposalCreatedWithTypeEvent ? proposalCreatedWithTypeEvent.data : "",
    })

    expect(decodedProposalCreatedEvent?.name).to.eql("ProposalCreated")
    expect(decodedProposalCreatedEvent?.args[1]).to.eql(proposerAddress)
    expect(decodedProposalCreatedEvent?.args[6]).to.eql(description)

    expect(decodedProposalCreatedWithTypeEvent?.name).to.eql("ProposalCreatedWithType")
    expect(decodedProposalCreatedWithTypeEvent?.args[1]).to.eql(ethers.toBigInt(expectedType))

    return {
      proposalId: decodedProposalCreatedEvent?.args[0],
      decodedProposalCreatedEvent,
      decodedProposalCreatedWithTypeEvent,
    }
  }

  async function createUniqueTestProposal(
    account: SignerWithAddress,
    useTypeMethod: boolean = false,
    proposalType: number = 0,
  ) {
    const unixTimestamp = Math.floor(Date.now() / 1000)
    const blockNumber = await ethers.provider.getBlockNumber()
    const functionToCall = "tokenDetails"
    const description = `Get token details ${unixTimestamp} ${blockNumber}`

    if (useTypeMethod) {
      const tx = await createProposalWithType(
        b3tr,
        b3trContract,
        account,
        description,
        functionToCall,
        [],
        proposalType,
      )
      return { tx, description, functionToCall }
    } else {
      const tx = await createProposal(b3tr, b3trContract, account, description, functionToCall, [])
      return { tx, description, functionToCall }
    }
  }

  describe("Proposal Creation with Types", function () {
    beforeEach(async function () {
      await bootstrapAndStartEmissions()
      await setupProposer(proposer)
    })

    it("Should create proposal with Standard type (0) when using propose() method", async function () {
      const { tx, description } = await createUniqueTestProposal(proposer, false, 0)
      const receipt = await tx.wait()

      const { proposalId } = await validateProposalEvents(receipt, 0, proposer.address, description)

      expect(await governor.state(proposalId)).to.eql(ethers.toBigInt(0))
      expect(await governor.proposalType(proposalId)).to.eql(ethers.toBigInt(0))
    })

    it("Should create proposal with Standard type (0) when explicitly specified", async function () {
      const { tx, description } = await createUniqueTestProposal(proposer, true, 0)
      const receipt = await tx.wait()

      const { proposalId } = await validateProposalEvents(receipt, 0, proposer.address, description)

      expect(await governor.state(proposalId)).to.eql(ethers.toBigInt(0))
      expect(await governor.proposalType(proposalId)).to.eql(ethers.toBigInt(0))
    })

    it("Should create proposal with Grant type (1) when specified", async function () {
      const { tx, description } = await createUniqueTestProposal(proposer, true, 1)
      const receipt = await tx.wait()

      const { proposalId } = await validateProposalEvents(receipt, 1, proposer.address, description)

      expect(await governor.state(proposalId)).to.eql(ethers.toBigInt(0))
      expect(await governor.proposalType(proposalId)).to.eql(ethers.toBigInt(1))
    })

    it("Should reject invalid proposal type (2) at contract level", async function () {
      const functionToCall = "tokenDetails"
      const unixTimestamp = Math.floor(Date.now() / 1000)
      const blockNumber = await ethers.provider.getBlockNumber()
      const description = `Get token details ${unixTimestamp} ${blockNumber}`

      await expect(createProposalWithType(b3tr, b3trContract, proposer, description, functionToCall, [], 2)).to.be
        .reverted
    })

    it("Should handle multiple proposals with different types", async function () {
      const { tx: tx1, description: desc1 } = await createUniqueTestProposal(proposer, true, 0)
      const receipt1 = await tx1.wait()
      const { proposalId: proposalId1 } = await validateProposalEvents(receipt1, 0, proposer.address, desc1)

      await waitForBlock(1)

      const proposer2 = otherAccounts[1]
      await setupProposer(proposer2)

      const { tx: tx2, description: desc2 } = await createUniqueTestProposal(proposer2, true, 1)
      const receipt2 = await tx2.wait()
      const { proposalId: proposalId2 } = await validateProposalEvents(receipt2, 1, proposer2.address, desc2)

      expect(await governor.proposalType(proposalId1)).to.eql(ethers.toBigInt(0))
      expect(await governor.proposalType(proposalId2)).to.eql(ethers.toBigInt(1))
    })
  })

  describe("Backward Compatibility", function () {
    beforeEach(async function () {
      await bootstrapAndStartEmissions()
      await setupProposer(proposer)
    })

    it("Should maintain backward compatibility with existing proposals", async function () {
      // Create a proposal using the old method (propose)
      const { tx, description } = await createUniqueTestProposal(proposer, false, 0)
      const receipt = await tx.wait()
      const proposalId = await getProposalIdFromTx(tx)

      // Verify the proposal works exactly as before
      expect(await governor.state(proposalId)).to.eql(ethers.toBigInt(0)) // pending
      expect(await governor.proposalProposer(proposalId)).to.eql(proposer.address)
      expect(await governor.proposalType(proposalId)).to.eql(ethers.toBigInt(0)) // Should default to Standard

      // Verify both events are emitted even for old method
      await validateProposalEvents(receipt, 0, proposer.address, description)
    })
  })

  describe("Event Validation", function () {
    beforeEach(async function () {
      await bootstrapAndStartEmissions()
      await setupProposer(proposer)
    })

    it("Should emit correct proposal type for different scenarios", async function () {
      const testCases = [
        { useTypeMethod: false, expectedType: 0, description: "Default Standard type via propose()" },
        { useTypeMethod: true, type: 0, expectedType: 0, description: "Explicit Standard type" },
        { useTypeMethod: true, type: 1, expectedType: 1, description: "Grant type" },
      ]

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i]
        const testProposer = i === 0 ? proposer : otherAccounts[i]

        if (i > 0) {
          await setupProposer(testProposer)
          await waitForBlock(1) // Ensure different timestamps
        }

        const { tx, description } = await createUniqueTestProposal(testProposer, testCase.useTypeMethod, testCase.type)
        const receipt = await tx.wait()

        await validateProposalEvents(receipt, testCase.expectedType, testProposer.address, description)
      }
    })
  })

  describe("Error Handling", function () {
    beforeEach(async function () {
      await bootstrapAndStartEmissions()
      await setupProposer(proposer)
    })

    it("Should handle contract-level validation for proposal types", async function () {
      const functionToCall = "tokenDetails"
      const description = "Get token details edge-case"

      // Test type 2 (should be rejected by contract if only 0 and 1 are valid)
      await expect(createProposalWithType(b3tr, b3trContract, proposer, description, functionToCall, [], 2)).to.be
        .reverted
    })
  })
})
