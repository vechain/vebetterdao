import { describe, it, beforeEach } from "mocha"
import { expect } from "chai"
import {
  setupProposer,
  createUniqueTestProposal,
  validateProposalEvents,
  setupGovernanceFixtureWithEmissions,
  GRANT_PROPOSAL_TYPE,
} from "./fixture.test"
import { B3TRGovernor, VOT3, B3TR, Treasury, GrantsManager } from "../../typechain-types"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { ContractFactory } from "ethers"
import { createProposalWithType, waitForBlock } from "../helpers/common"
import { ethers } from "hardhat"

describe("Governance - Proposal Types", function () {
  let governor: B3TRGovernor
  let vot3: VOT3
  let b3tr: B3TR
  let otherAccounts: SignerWithAddress[]
  let b3trContract: ContractFactory
  let minterAccount: SignerWithAddress
  let proposer: SignerWithAddress
  let treasury: Treasury
  let grantsManager: GrantsManager

  beforeEach(async function () {
    const fixture = await setupGovernanceFixtureWithEmissions()
    governor = fixture.governor
    vot3 = fixture.vot3
    b3tr = fixture.b3tr
    otherAccounts = fixture.otherAccounts
    b3trContract = fixture.b3trContract
    minterAccount = fixture.minterAccount
    proposer = fixture.proposer
    treasury = fixture.treasury
    grantsManager = fixture.grantsManager

    // Setup proposer for all tests
    await setupProposer(proposer, b3tr, vot3, minterAccount)
  })

  describe("Proposal Creation with Types", function () {
    it("Should create proposal with Standard type (0) when using propose() method", async function () {
      const { tx, description } = await createUniqueTestProposal(proposer, b3tr, b3trContract, false, 0)
      const receipt = await tx.wait()

      const { proposalId } = await validateProposalEvents(governor, receipt, 0, proposer.address, description)

      expect(await governor.state(proposalId)).to.eql(ethers.toBigInt(0))
      expect(await governor.proposalType(proposalId)).to.eql(ethers.toBigInt(0))
    })

    it("Should create proposal with Standard type (0) when explicitly specified", async function () {
      const { tx, description } = await createUniqueTestProposal(proposer, b3tr, b3trContract, true, 0)
      const receipt = await tx.wait()

      const { proposalId } = await validateProposalEvents(governor, receipt, 0, proposer.address, description)

      expect(await governor.state(proposalId)).to.eql(ethers.toBigInt(0))
      expect(await governor.proposalType(proposalId)).to.eql(ethers.toBigInt(0))
    })

    it("Should create proposal with Grant type (1) when specified", async function () {
      const { tx, description } = await createUniqueTestProposal(proposer, b3tr, b3trContract, true, 1)
      const receipt = await tx.wait()

      const { proposalId } = await validateProposalEvents(governor, receipt, 1, proposer.address, description)

      expect(await governor.state(proposalId)).to.eql(ethers.toBigInt(0))
      expect(await governor.proposalType(proposalId)).to.eql(ethers.toBigInt(1))
    })

    it("Should reject invalid proposal type (2) at contract level", async function () {
      const functionToCall = "tokenDetails"
      const unixTimestamp = Math.floor(Date.now() / 1000)
      const blockNumber = await ethers.provider.getBlockNumber()
      const description = `Get token details ${unixTimestamp} ${blockNumber}`

      await expect(createProposalWithType(b3tr, b3trContract, proposer, description, [functionToCall], [], 2)).to.be
        .reverted
    })

    it("Should handle multiple proposals with different types", async function () {
      const { tx: tx1, description: desc1 } = await createUniqueTestProposal(proposer, b3tr, b3trContract, true, 0)
      const receipt1 = await tx1.wait()
      const { proposalId: proposalId1 } = await validateProposalEvents(governor, receipt1, 0, proposer.address, desc1)

      await waitForBlock(1)

      const proposer2 = otherAccounts[1]
      await setupProposer(proposer2, b3tr, vot3, minterAccount)

      const { tx: tx2, description: desc2 } = await createUniqueTestProposal(proposer2, b3tr, b3trContract, true, 1)
      const receipt2 = await tx2.wait()
      const { proposalId: proposalId2 } = await validateProposalEvents(governor, receipt2, 1, proposer2.address, desc2)

      expect(await governor.proposalType(proposalId1)).to.eql(ethers.toBigInt(0))
      expect(await governor.proposalType(proposalId2)).to.eql(ethers.toBigInt(1))
    })
  })

  describe("Event Validation", function () {
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
          await setupProposer(testProposer, b3tr, vot3, minterAccount)
          await waitForBlock(1) // Ensure different timestamps
        }

        const { tx, description } = await createUniqueTestProposal(
          testProposer,
          b3tr,
          b3trContract,
          testCase.useTypeMethod,
          testCase.type,
        )
        const receipt = await tx.wait()

        await validateProposalEvents(governor, receipt, testCase.expectedType, testProposer.address, description)
      }
    })
  })

  describe("Error Handling", function () {
    it("Should handle contract-level validation for proposal types", async function () {
      const functionToCall = "tokenDetails"
      const description = "Get token details edge-case"

      // Test type 2 (should be rejected by contract if only 0 and 1 are valid)
      await expect(createProposalWithType(b3tr, b3trContract, proposer, description, [functionToCall], [], 2)).to.be
        .reverted
    })
  })
})
