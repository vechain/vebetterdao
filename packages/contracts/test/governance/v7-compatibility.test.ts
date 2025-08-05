import { describe, it, beforeEach } from "mocha"
import { expect } from "chai"
import {
  setupProposer,
  validateProposalEvents,
  setupGovernanceFixtureWithEmissions,
  STANDARD_PROPOSAL_TYPE,
  GRANT_PROPOSAL_TYPE,
} from "./fixture.test"
import { B3TRGovernor, VOT3, B3TR } from "../../typechain-types"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { ContractFactory } from "ethers"
import { createProposal, getProposalIdFromTx } from "../helpers/common"
import { ethers } from "hardhat"
import { createLocalConfig } from "@repo/config/contracts/envs/local"

describe.only("Governance - Compatibility & Thresholds", function () {
  let governor: B3TRGovernor
  let vot3: VOT3
  let b3tr: B3TR
  let b3trContract: ContractFactory
  let minterAccount: SignerWithAddress
  let proposer: SignerWithAddress
  let owner: SignerWithAddress

  beforeEach(async function () {
    const fixture = await setupGovernanceFixtureWithEmissions()
    governor = fixture.governor
    vot3 = fixture.vot3
    b3tr = fixture.b3tr
    b3trContract = fixture.b3trContract
    minterAccount = fixture.minterAccount
    proposer = fixture.proposer
    owner = fixture.owner

    // Setup proposer for all tests
    await setupProposer(proposer, b3tr, vot3, minterAccount)
  })

  describe("Backward Compatibility", function () {
    it("Should maintain backward compatibility with existing proposals", async function () {
      const description = "coolDescription"
      // Create a proposal using the old method (propose)
      const tx = await createProposal(b3tr, b3trContract, proposer, description)
      const receipt = await tx.wait()
      const proposalId = await getProposalIdFromTx(tx)

      // Verify the proposal works exactly as before
      expect(await governor.state(proposalId)).to.eql(ethers.toBigInt(0)) // pending
      expect(await governor.proposalProposer(proposalId)).to.eql(proposer.address)
      expect(await governor.proposalType(proposalId)).to.eql(STANDARD_PROPOSAL_TYPE) // Should default to Standard

      // Verify both events are emitted even for old method
      await validateProposalEvents(governor, receipt, Number(STANDARD_PROPOSAL_TYPE), proposer.address, description)
    })
  })

  describe("Deposit Threshold Functionality", function () {
    it("Should return the correct deposit threshold for a proposal type", async function () {
      const config = createLocalConfig()

      // Get the current total supply
      const totalSupply = await b3tr.totalSupply()

      //Calculate expected deposit thresholds considering the cap
      const standardDepositThresholdCap = ethers.toBigInt(config.B3TR_GOVERNOR_STANDARD_DEPOSIT_THRESHOLD_CAP)
      const grantDepositThresholdCap = ethers.toBigInt(config.B3TR_GOVERNOR_GRANT_DEPOSIT_THRESHOLD_CAP)

      const expectedStandardDepositThreshold =
        (ethers.toBigInt(config.B3TR_GOVERNOR_DEPOSIT_THRESHOLD) * totalSupply) / ethers.toBigInt(100) >
        standardDepositThresholdCap
          ? standardDepositThresholdCap
          : (ethers.toBigInt(config.B3TR_GOVERNOR_DEPOSIT_THRESHOLD) * totalSupply) / ethers.toBigInt(100)
      const expectedGrantDepositThreshold =
        (ethers.toBigInt(config.B3TR_GOVERNOR_GRANT_DEPOSIT_THRESHOLD) * totalSupply) / ethers.toBigInt(100) >
        grantDepositThresholdCap
          ? grantDepositThresholdCap
          : (ethers.toBigInt(config.B3TR_GOVERNOR_GRANT_DEPOSIT_THRESHOLD) * totalSupply) / ethers.toBigInt(100)

      //Standard threshold percentage remains the same after upgrade
      const depositThreshold = await governor.depositThresholdByProposalType(STANDARD_PROPOSAL_TYPE)
      expect(depositThreshold).to.eql(expectedStandardDepositThreshold)

      //Grant threshold percentage remains the same after upgrade
      const depositThresholdGrant = await governor.depositThresholdByProposalType(GRANT_PROPOSAL_TYPE)
      expect(depositThresholdGrant).to.eql(expectedGrantDepositThreshold)
    })

    it("Should return the correct deposit threshold for STANDARD proposal type using the old method", async function () {
      const config = createLocalConfig()

      // Get the current total supply
      const totalSupply = await b3tr.totalSupply()

      //Calculate expected deposit thresholds considering the cap
      const standardDepositThresholdCap = ethers.toBigInt(config.B3TR_GOVERNOR_STANDARD_DEPOSIT_THRESHOLD_CAP)

      // Calculate expected deposit threshold: (percentage * totalSupply) / 100
      const expectedDepositThreshold =
        (ethers.toBigInt(config.B3TR_GOVERNOR_DEPOSIT_THRESHOLD) * totalSupply) / ethers.toBigInt(100) >
        standardDepositThresholdCap
          ? standardDepositThresholdCap
          : (ethers.toBigInt(config.B3TR_GOVERNOR_DEPOSIT_THRESHOLD) * totalSupply) / ethers.toBigInt(100)

      const depositThreshold = await governor.depositThresholdByProposalType(STANDARD_PROPOSAL_TYPE)
      expect(depositThreshold).to.eql(expectedDepositThreshold)
    })

    it("Should return the max cap for proposals if the percentage based threshold is greater than the max threshold", async function () {
      const proposalStandardType = ethers.toBigInt(0)
      const config = createLocalConfig()
      const expectedThreshold = ethers.toBigInt(config.B3TR_GOVERNOR_STANDARD_DEPOSIT_THRESHOLD_CAP)

      // Set the deposit threshold percentage to 100%
      await governor.connect(owner).setProposalTypeDepositThresholdPercentage(100, proposalStandardType)

      // Get the deposit threshold
      const depositThreshold = await governor.depositThresholdByProposalType(STANDARD_PROPOSAL_TYPE)
      expect(depositThreshold).to.eql(expectedThreshold)
    })
  })
})
