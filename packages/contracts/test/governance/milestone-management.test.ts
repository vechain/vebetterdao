import { describe, it, beforeEach } from "mocha"
import { setupProposer, setupGovernanceFixtureWithEmissions } from "./fixture.test"
import {
  B3TRGovernor,
  VOT3,
  B3TR,
  Treasury,
  GrantsManager,
  VeBetterPassport,
  TimeLock,
  Emissions,
  XAllocationVoting,
  GrantsManager__factory,
  GovernorProposalLogic__factory,
  B3TRGovernor__factory,
} from "../../typechain-types"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { ethers } from "hardhat"
import { expect } from "chai"
import { ContractFactory, Interface } from "ethers"
import { createProposalWithMultipleFunctionsAndExecuteItGrant } from "../helpers/common"

describe("Governance - Milestone Management - @shard4g", function () {
  let governor: B3TRGovernor
  let vot3: VOT3
  let b3tr: B3TR
  let minterAccount: SignerWithAddress
  let proposer: SignerWithAddress
  let secondaryAccount: SignerWithAddress
  let treasury: Treasury
  let grantsManager: GrantsManager
  let owner: SignerWithAddress
  let voter: SignerWithAddress
  let veBetterPassport: VeBetterPassport
  let timeLock: TimeLock
  let grantsManagerAddress: string
  let treasuryAddress: string
  let emissions: Emissions
  let xAllocationVoting: XAllocationVoting
  let contractToPassToMethods: any
  let treasuryContract: ContractFactory
  let grantsManagerInterface: Interface
  let governorProposalLogicInterface: Interface
  let governorInterface: Interface
  beforeEach(async function () {
    const fixture = await setupGovernanceFixtureWithEmissions()
    governor = fixture.governor
    vot3 = fixture.vot3
    b3tr = fixture.b3tr
    minterAccount = fixture.minterAccount
    proposer = fixture.proposer
    secondaryAccount = fixture.otherAccount
    treasury = fixture.treasury
    grantsManager = fixture.grantsManager
    owner = fixture.owner
    voter = fixture.voter
    veBetterPassport = fixture.veBetterPassport
    timeLock = fixture.timeLock
    emissions = fixture.emissions
    xAllocationVoting = fixture.xAllocationVoting

    // Setup proposer for all tests
    await emissions.connect(minterAccount).start()
    await setupProposer(proposer, b3tr, vot3, minterAccount)
    await vot3.connect(proposer).approve(await governor.getAddress(), ethers.parseEther("1000"))

    grantsManagerAddress = await grantsManager.getAddress()
    treasuryAddress = await treasury.getAddress()
    treasuryContract = await ethers.getContractFactory("Treasury")
    contractToPassToMethods = {
      b3tr,
      vot3,
      minterAccount,
      governor,
      treasury,
      emissions,
      xAllocationVoting,
      veBetterPassport,
      owner,
      timeLock,
      grantsManager,
    }

    grantsManagerInterface = GrantsManager__factory.createInterface()
    governorProposalLogicInterface = GovernorProposalLogic__factory.createInterface()
    governorInterface = B3TRGovernor__factory.createInterface()
  })

  describe("Milestone Flow", function () {
    //Can approve milestone
    //Can reject milestone/grant
    //Can claim milestone
    //Can approve other milestones having pending ones to claim
    //Can approve other milestones having claimed ones
    //Can reject other milestones having pending ones to claim
    //Can reject other milestones having claimed ones previously
    //Receiver can claim approved milestones
    //Receiver can claim approved milestones even if the proposal is rejected

    it("Milestone can be APPROVED by GRANTS_APPROVER_ROLE and claimed funds sent to the receiver", async () => {
      const description = "My new project"
      const values = [ethers.parseEther("10000"), ethers.parseEther("10000")]
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later

      const { proposalId } = await createProposalWithMultipleFunctionsAndExecuteItGrant(
        proposer, // proposer
        owner, // voter
        [treasury, treasury], // targets ( 2 transfers )
        treasuryContract, // contract to pass to avoid re-deploying the contracts
        description, // description ( will be empty in the proposal, because if modified, the proposalId and milestoneId will be modified => lost in the see)
        ["transferB3TR", "transferB3TR"], // functionToCall
        [
          [grantsManagerAddress, values[0]],
          [grantsManagerAddress, values[1]],
        ], // args of transferb3tr( should have a revert if the amount is not equal)
        "0", // deposit amount
        secondaryAccount.address,
        milestonesDetailsMetadataURI, // milestones
        contractToPassToMethods, // contracts to pass to avoid re-deploying the contracts
      )

      const balanceBeforeClaiming = await b3tr.balanceOf(secondaryAccount.address)

      // try to approve with someone else than the governor roles
      // grant owner the approver role
      await grantsManager.grantRole(await grantsManager.GRANTS_APPROVER_ROLE(), owner.address)
      await expect(grantsManager.connect(proposer).approveMilestones(proposalId, 0)).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "NotAuthorized",
      )
      // try to claim will it have not been approve by any governor role
      await expect(grantsManager.connect(secondaryAccount).claimMilestone(proposalId, 0)).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "MilestoneNotApprovedByAdmin",
      )

      // grant owner the approver role
      await grantsManager.grantRole(await grantsManager.GRANTS_APPROVER_ROLE(), owner.address)
      // try to approve the 2nd milestone before approving the first one
      await expect(grantsManager.connect(owner).approveMilestones(proposalId, 1)).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "PreviousMilestoneNotApproved",
      )

      // approve with the correct role
      await grantsManager.connect(owner).approveMilestones(proposalId, 0)
      // try to claim with someone else than the grants receiver
      await expect(grantsManager.connect(voter).claimMilestone(proposalId, 0)).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "CallerIsNotTheGrantReceiver",
      )

      // try to claim the 2nd milestone before approving the first one
      await expect(grantsManager.connect(secondaryAccount).claimMilestone(proposalId, 1)).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "MilestoneNotApprovedByAdmin",
      )

      // Claim the milestone
      // claim the milestone with the correct role
      await grantsManager.connect(secondaryAccount).claimMilestone(proposalId, 0)

      // check the state of the milestone 0
      const milestone0 = await grantsManager.getMilestone(proposalId, 0)
      expect(milestone0.isClaimed).to.equal(true) // Claimed

      // approve the second milestone
      await grantsManager.connect(owner).approveMilestones(proposalId, 1)
      // claim the second milestone
      await grantsManager.connect(secondaryAccount).claimMilestone(proposalId, 1)

      const balanceAfterClaiming = await b3tr.balanceOf(secondaryAccount.address)
      expect(balanceAfterClaiming).to.equal(balanceBeforeClaiming + ethers.parseEther("20000"))
    })

    it("Milestone can be REJECTED by GRANTS_REJECTOR_ROLE and ONLY the rejected milestones amount sent to the treasury", async () => {
      const description = "My new project"
      const values = [ethers.parseEther("10000"), ethers.parseEther("10000")]
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later

      const { proposalId } = await createProposalWithMultipleFunctionsAndExecuteItGrant(
        proposer, // proposer
        owner, // voter
        [treasury, treasury], // targets ( 2 transfers )
        treasuryContract, // contract to pass to avoid re-deploying the contracts
        description, // description ( will be empty in the proposal, because if modified, the proposalId and milestoneId will be modified => lost in the see)
        ["transferB3TR", "transferB3TR"], // functionToCall
        [
          [grantsManagerAddress, values[0]],
          [grantsManagerAddress, values[1]],
        ], // args of transferb3tr( should have a revert if the amount is not equal)
        "0", // deposit amount
        secondaryAccount.address,
        milestonesDetailsMetadataURI, // milestones
        contractToPassToMethods, // contracts to pass to avoid re-deploying the contracts
      )

      const receiverBalanceBeforeRejecting = await b3tr.balanceOf(secondaryAccount.address)
      const treasuryBalanceBeforeRejecting = await b3tr.balanceOf(treasuryAddress)
      const grantsManagerBalanceBeforeRejecting = await b3tr.balanceOf(grantsManagerAddress)

      //Grant the rejector role
      await grantsManager.grantRole(await grantsManager.GRANTS_REJECTOR_ROLE(), owner.address)

      //Try to reject with someone else than the allowed account
      await expect(grantsManager.connect(proposer).rejectMilestones(proposalId)).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "NotAuthorized",
      )

      //Reject with the allowed account
      await grantsManager.connect(owner).rejectMilestones(proposalId)

      //Try to reject the grant if it is already rejected
      await expect(grantsManager.connect(owner).rejectMilestones(proposalId)).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "GrantAlreadyRejected",
      )
      // Try to claim the milestone if it is already rejected
      await expect(grantsManager.connect(secondaryAccount).claimMilestone(proposalId, 0)).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "MilestoneNotApprovedByAdmin",
      )
      const grantsTotalAmount = values.reduce((a, b) => a + b, 0n)
      const receiverBalanceAfterRejecting = await b3tr.balanceOf(secondaryAccount.address)
      const treasuryBalanceAfterRejecting = await b3tr.balanceOf(treasuryAddress)
      const grantsManagerBalanceAfterRejecting = await b3tr.balanceOf(grantsManagerAddress)
      //Receiver should still have the same balance as before
      expect(receiverBalanceAfterRejecting).to.equal(receiverBalanceBeforeRejecting)
      //Treasury balance should increase the exact amount of the rejected milestone
      expect(treasuryBalanceAfterRejecting).to.equal(treasuryBalanceBeforeRejecting + grantsTotalAmount)
      //Grants manager balance should still be the same
      expect(grantsManagerBalanceAfterRejecting).to.equal(grantsManagerBalanceBeforeRejecting - grantsTotalAmount)
    })
    it("Milestone can be APPROVED if there are pending milestones to claim", async () => {
      const description = "My new project"
      const values = [ethers.parseEther("10000"), ethers.parseEther("10000")]
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later

      const { proposalId } = await createProposalWithMultipleFunctionsAndExecuteItGrant(
        proposer, // proposer
        owner, // voter
        [treasury, treasury], // targets ( 2 transfers )
        treasuryContract, // contract to pass to avoid re-deploying the contracts
        description, // description ( will be empty in the proposal, because if modified, the proposalId and milestoneId will be modified => lost in the see)
        ["transferB3TR", "transferB3TR"], // functionToCall
        [
          [grantsManagerAddress, values[0]],
          [grantsManagerAddress, values[1]],
        ], // args of transferb3tr( should have a revert if the amount is not equal)
        "0", // deposit amount
        secondaryAccount.address,
        milestonesDetailsMetadataURI, // milestones
        contractToPassToMethods, // contracts to pass to avoid re-deploying the contracts
      )

      const receiverBalanceBeforeApproving = await b3tr.balanceOf(secondaryAccount.address)
      const treasuryBalanceBeforeApproving = await b3tr.balanceOf(treasuryAddress)
      const grantsManagerBalanceBeforeApproving = await b3tr.balanceOf(grantsManagerAddress)

      // Grant the approver role
      await grantsManager.grantRole(await grantsManager.GRANTS_APPROVER_ROLE(), owner.address)

      // Approve the first milestone
      await grantsManager.connect(owner).approveMilestones(proposalId, 0)

      // Approve the second milestone
      await grantsManager.connect(owner).approveMilestones(proposalId, 1)

      // Claim the first milestone
      await grantsManager.connect(secondaryAccount).claimMilestone(proposalId, 0)

      // Claim the second milestone
      await grantsManager.connect(secondaryAccount).claimMilestone(proposalId, 1)

      const grantsTotalAmount = values.reduce((a, b) => a + b, 0n)
      const receiverBalanceAfterApproving = await b3tr.balanceOf(secondaryAccount.address)
      const treasuryBalanceAfterApproving = await b3tr.balanceOf(treasuryAddress)
      const grantsManagerBalanceAfterApproving = await b3tr.balanceOf(grantsManagerAddress)

      expect(receiverBalanceAfterApproving).to.equal(receiverBalanceBeforeApproving + grantsTotalAmount)
      expect(treasuryBalanceAfterApproving).to.equal(treasuryBalanceBeforeApproving)
      expect(grantsManagerBalanceAfterApproving).to.equal(grantsManagerBalanceBeforeApproving - grantsTotalAmount)
    })

    it("Milestone can be APPROVED if there are claimed milestones", async () => {
      const description = "My new project"
      const values = [ethers.parseEther("10000"), ethers.parseEther("10000")]
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later

      const { proposalId } = await createProposalWithMultipleFunctionsAndExecuteItGrant(
        proposer, // proposer
        owner, // voter
        [treasury, treasury], // targets ( 2 transfers )
        treasuryContract, // contract to pass to avoid re-deploying the contracts
        description, // description ( will be empty in the proposal, because if modified, the proposalId and milestoneId will be modified => lost in the see)
        ["transferB3TR", "transferB3TR"], // functionToCall
        [
          [grantsManagerAddress, values[0]],
          [grantsManagerAddress, values[1]],
        ], // args of transferb3tr( should have a revert if the amount is not equal)
        "0", // deposit amount
        secondaryAccount.address,
        milestonesDetailsMetadataURI, // milestones
        contractToPassToMethods, // contracts to pass to avoid re-deploying the contracts
      )

      const receiverBalanceBeforeApproving = await b3tr.balanceOf(secondaryAccount.address)
      const treasuryBalanceBeforeApproving = await b3tr.balanceOf(treasuryAddress)
      const grantsManagerBalanceBeforeApproving = await b3tr.balanceOf(grantsManagerAddress)

      // Grant the approver role
      await grantsManager.grantRole(await grantsManager.GRANTS_APPROVER_ROLE(), owner.address)

      // Approve the first milestone
      await grantsManager.connect(owner).approveMilestones(proposalId, 0)

      // Claim the first milestone
      await grantsManager.connect(secondaryAccount).claimMilestone(proposalId, 0)

      // Approve the second milestone
      await grantsManager.connect(owner).approveMilestones(proposalId, 1)

      // Claim the second milestone
      await grantsManager.connect(secondaryAccount).claimMilestone(proposalId, 1)

      const grantsTotalAmount = values.reduce((a, b) => a + b, 0n)
      const receiverBalanceAfterApproving = await b3tr.balanceOf(secondaryAccount.address)
      const treasuryBalanceAfterApproving = await b3tr.balanceOf(treasuryAddress)
      const grantsManagerBalanceAfterApproving = await b3tr.balanceOf(grantsManagerAddress)

      expect(receiverBalanceAfterApproving).to.equal(receiverBalanceBeforeApproving + grantsTotalAmount)
      expect(treasuryBalanceAfterApproving).to.equal(treasuryBalanceBeforeApproving)
      expect(grantsManagerBalanceAfterApproving).to.equal(grantsManagerBalanceBeforeApproving - grantsTotalAmount)
    })

    it("Milestone/Grant can be REJECTED if there are pending milestones to claim", async () => {
      const description = "My new project"
      const values = [ethers.parseEther("10000"), ethers.parseEther("10000")]
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later

      const { proposalId } = await createProposalWithMultipleFunctionsAndExecuteItGrant(
        proposer, // proposer
        owner, // voter
        [treasury, treasury], // targets ( 2 transfers )
        treasuryContract, // contract to pass to avoid re-deploying the contracts
        description, // description ( will be empty in the proposal, because if modified, the proposalId and milestoneId will be modified => lost in the see)
        ["transferB3TR", "transferB3TR"], // functionToCall
        [
          [grantsManagerAddress, values[0]],
          [grantsManagerAddress, values[1]],
        ], // args of transferb3tr( should have a revert if the amount is not equal)
        "0", // deposit amount
        secondaryAccount.address,
        milestonesDetailsMetadataURI, // milestones
        contractToPassToMethods, // contracts to pass to avoid re-deploying the contracts
      )

      const receiverBalanceBeforeRejecting = await b3tr.balanceOf(secondaryAccount.address)
      const treasuryBalanceBeforeRejecting = await b3tr.balanceOf(treasuryAddress)
      const grantsManagerBalanceBeforeRejecting = await b3tr.balanceOf(grantsManagerAddress)

      // Grant the approver role
      await grantsManager.grantRole(await grantsManager.GRANTS_APPROVER_ROLE(), owner.address)

      // Approve the first milestone
      await grantsManager.connect(owner).approveMilestones(proposalId, 0)

      // Reject the grant
      await grantsManager.connect(owner).rejectMilestones(proposalId)

      const rejectMilestoneAmount = values[1]
      const receiverBalanceAfterRejecting = await b3tr.balanceOf(secondaryAccount.address)
      const treasuryBalanceAfterRejecting = await b3tr.balanceOf(treasuryAddress)
      const grantsManagerBalanceAfterRejecting = await b3tr.balanceOf(grantsManagerAddress)

      //Receiver should still have the same balance as before since it didn't claim the milestone
      expect(receiverBalanceAfterRejecting).to.equal(receiverBalanceBeforeRejecting)
      //Treasury balance should increase the exact amount of the rejected milestone
      expect(treasuryBalanceAfterRejecting).to.equal(treasuryBalanceBeforeRejecting + rejectMilestoneAmount)
      //Grants manager balance should decrease the exact amount of the rejected milestone
      expect(grantsManagerBalanceAfterRejecting).to.equal(grantsManagerBalanceBeforeRejecting - rejectMilestoneAmount)
    })

    it("Milestones/Grant can be REJECTED if there are claimed milestones", async () => {
      const description = "My new project"
      const values = [
        ethers.parseEther("10000"),
        ethers.parseEther("10000"),
        ethers.parseEther("20000"),
        ethers.parseEther("70000"),
      ]
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later

      const { proposalId } = await createProposalWithMultipleFunctionsAndExecuteItGrant(
        proposer, // proposer
        owner, // voter
        [treasury, treasury, treasury, treasury], // targets ( 4 transfers )
        treasuryContract, // contract to pass to avoid re-deploying the contracts
        description, // description ( will be empty in the proposal, because if modified, the proposalId and milestoneId will be modified => lost in the see)
        ["transferB3TR", "transferB3TR", "transferB3TR", "transferB3TR"], // functionToCall
        [
          [grantsManagerAddress, values[0]],
          [grantsManagerAddress, values[1]],
          [grantsManagerAddress, values[2]],
          [grantsManagerAddress, values[3]],
        ], // args of transferb3tr( should have a revert if the amount is not equal)
        "0", // deposit amount
        secondaryAccount.address,
        milestonesDetailsMetadataURI, // milestones
        contractToPassToMethods, // contracts to pass to avoid re-deploying the contracts
      )

      const receiverBalanceBeforeRejecting = await b3tr.balanceOf(secondaryAccount.address)
      const treasuryBalanceBeforeRejecting = await b3tr.balanceOf(treasuryAddress)
      const grantsManagerBalanceBeforeRejecting = await b3tr.balanceOf(grantsManagerAddress)

      // Grant the approver role
      await grantsManager.grantRole(await grantsManager.GRANTS_APPROVER_ROLE(), owner.address)

      // Approve the first milestone
      await grantsManager.connect(owner).approveMilestones(proposalId, 0)

      // Claim the first milestone
      await grantsManager.connect(secondaryAccount).claimMilestone(proposalId, 0)

      // Approve the second milestone
      await grantsManager.connect(owner).approveMilestones(proposalId, 1)

      // Reject the grant
      await grantsManager.connect(owner).rejectMilestones(proposalId)

      //At this point, grant is rejected:
      //Milestone 1 is claimed
      //Milestone 2 is approved
      //Milestone 3 is rejected
      //Milestone 4 is rejected

      const claimedMilestoneAmount = values[0]
      const rejectedMilestonesAmount = values[2] + values[3]
      const receiverBalanceAfterRejecting = await b3tr.balanceOf(secondaryAccount.address)
      const treasuryBalanceAfterRejecting = await b3tr.balanceOf(treasuryAddress)
      const grantsManagerBalanceAfterRejecting = await b3tr.balanceOf(grantsManagerAddress)

      //Receiver balance should increase the exact amount of the claimed milestone
      expect(receiverBalanceAfterRejecting).to.equal(receiverBalanceBeforeRejecting + claimedMilestoneAmount)
      //Treasury balance should increase the exact amount of the rejected milestones
      expect(treasuryBalanceAfterRejecting).to.equal(treasuryBalanceBeforeRejecting + rejectedMilestonesAmount)
      //Grants manager balance should decrease the exact amount of the claimed and rejected milestones
      expect(grantsManagerBalanceAfterRejecting).to.equal(
        grantsManagerBalanceBeforeRejecting - rejectedMilestonesAmount - claimedMilestoneAmount,
      )
    })
    it("Milestones APPROVED can be CLAIMED and only the claimed milestones amount sent to the receiver", async () => {
      const description = "My new project"
      const values = [
        ethers.parseEther("10000"),
        ethers.parseEther("10000"),
        ethers.parseEther("20000"),
        ethers.parseEther("70000"),
      ]
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later

      const { proposalId } = await createProposalWithMultipleFunctionsAndExecuteItGrant(
        proposer, // proposer
        owner, // voter
        [treasury, treasury, treasury, treasury], // targets ( 4 transfers )
        treasuryContract, // contract to pass to avoid re-deploying the contracts
        description, // description ( will be empty in the proposal, because if modified, the proposalId and milestoneId will be modified => lost in the see)
        ["transferB3TR", "transferB3TR", "transferB3TR", "transferB3TR"], // functionToCall
        [
          [grantsManagerAddress, values[0]],
          [grantsManagerAddress, values[1]],
          [grantsManagerAddress, values[2]],
          [grantsManagerAddress, values[3]],
        ], // args of transferb3tr( should have a revert if the amount is not equal)
        "0", // deposit amount
        secondaryAccount.address,
        milestonesDetailsMetadataURI, // milestones
        contractToPassToMethods, // contracts to pass to avoid re-deploying the contracts
      )

      const receiverBalanceBeforeClaiming = await b3tr.balanceOf(secondaryAccount.address)
      const treasuryBalanceBeforeClaiming = await b3tr.balanceOf(treasuryAddress)
      const grantsManagerBalanceBeforeClaiming = await b3tr.balanceOf(grantsManagerAddress)

      // Grant the approver role
      await grantsManager.grantRole(await grantsManager.GRANTS_APPROVER_ROLE(), owner.address)

      // Approve the first milestone
      await grantsManager.connect(owner).approveMilestones(proposalId, 0)

      // Claim the first milestone
      await grantsManager.connect(secondaryAccount).claimMilestone(proposalId, 0)

      // Approve the second milestone
      await grantsManager.connect(owner).approveMilestones(proposalId, 1)

      // Claim the second milestone
      await grantsManager.connect(secondaryAccount).claimMilestone(proposalId, 1)

      //Try to claim the second milestone again
      await expect(grantsManager.connect(secondaryAccount).claimMilestone(proposalId, 1)).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "MilestoneAlreadyClaimed",
      )

      //Try to claim a not approved milestone
      await expect(grantsManager.connect(secondaryAccount).claimMilestone(proposalId, 2)).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "MilestoneNotApprovedByAdmin",
      )

      //At this point, grant is rejected:
      //Milestone 1 is claimed
      //Milestone 2 is claimed
      //Milestone 3 is pending
      //Milestone 4 is pending

      const claimedMilestonesAmount = values[0] + values[1]
      const rejectedMilestonesAmount = values[2] + values[3]
      const receiverBalanceAfterClaiming = await b3tr.balanceOf(secondaryAccount.address)
      const treasuryBalanceAfterClaiming = await b3tr.balanceOf(treasuryAddress)
      const grantsManagerBalanceAfterClaiming = await b3tr.balanceOf(grantsManagerAddress)

      //Receiver balance should increase the exact amount of the claimed milestones
      expect(receiverBalanceAfterClaiming).to.equal(receiverBalanceBeforeClaiming + claimedMilestonesAmount)
      //Treasury balance should remain the same
      expect(treasuryBalanceAfterClaiming).to.equal(treasuryBalanceBeforeClaiming)
      //Grants manager balance should decrease the exact amount of the claimed milestones
      expect(grantsManagerBalanceAfterClaiming).to.equal(grantsManagerBalanceBeforeClaiming - claimedMilestonesAmount)
    })
    it("Milestones APPROVED can be CLAIMED even if the grant is rejected and only the rejected milestones amount sent to the treasury", async () => {
      const description = "My new project"
      const values = [
        ethers.parseEther("10000"),
        ethers.parseEther("10000"),
        ethers.parseEther("20000"),
        ethers.parseEther("70000"),
      ]
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later

      const { proposalId } = await createProposalWithMultipleFunctionsAndExecuteItGrant(
        proposer, // proposer
        owner, // voter
        [treasury, treasury, treasury, treasury], // targets ( 4 transfers )
        treasuryContract, // contract to pass to avoid re-deploying the contracts
        description, // description ( will be empty in the proposal, because if modified, the proposalId and milestoneId will be modified => lost in the see)
        ["transferB3TR", "transferB3TR", "transferB3TR", "transferB3TR"], // functionToCall
        [
          [grantsManagerAddress, values[0]],
          [grantsManagerAddress, values[1]],
          [grantsManagerAddress, values[2]],
          [grantsManagerAddress, values[3]],
        ], // args of transferb3tr( should have a revert if the amount is not equal)
        "0", // deposit amount
        secondaryAccount.address,
        milestonesDetailsMetadataURI, // milestones
        contractToPassToMethods, // contracts to pass to avoid re-deploying the contracts
      )

      const receiverBalanceBeforeRejecting = await b3tr.balanceOf(secondaryAccount.address)
      const treasuryBalanceBeforeRejecting = await b3tr.balanceOf(treasuryAddress)
      const grantsManagerBalanceBeforeRejecting = await b3tr.balanceOf(grantsManagerAddress)

      // Grant the approver role
      await grantsManager.grantRole(await grantsManager.GRANTS_APPROVER_ROLE(), owner.address)

      // Approve the first milestone
      await grantsManager.connect(owner).approveMilestones(proposalId, 0)

      // Claim the first milestone
      await grantsManager.connect(secondaryAccount).claimMilestone(proposalId, 0)

      // Approve the second milestone
      await grantsManager.connect(owner).approveMilestones(proposalId, 1)

      // Reject the grant
      await grantsManager.connect(owner).rejectMilestones(proposalId)

      //At this point, grant is rejected:
      //Milestone 1 is claimed
      //Milestone 2 is approved
      //Milestone 3 is rejected
      //Milestone 4 is rejected

      const firstClaimedMilestoneAmount = values[0]
      const rejectedMilestonesAmount = values[2] + values[3]
      const receiverBalanceAfterRejecting = await b3tr.balanceOf(secondaryAccount.address)
      const treasuryBalanceAfterRejecting = await b3tr.balanceOf(treasuryAddress)
      const grantsManagerBalanceAfterRejecting = await b3tr.balanceOf(grantsManagerAddress)

      //Receiver balance should increase the exact amount of the claimed milestone
      expect(receiverBalanceAfterRejecting).to.equal(receiverBalanceBeforeRejecting + firstClaimedMilestoneAmount)
      //Treasury balance should increase the exact amount of the rejected milestones
      expect(treasuryBalanceAfterRejecting).to.equal(treasuryBalanceBeforeRejecting + rejectedMilestonesAmount)
      //Grants manager balance should decrease the exact amount of the claimed and rejected milestones
      expect(grantsManagerBalanceAfterRejecting).to.equal(
        grantsManagerBalanceBeforeRejecting - rejectedMilestonesAmount - firstClaimedMilestoneAmount,
      )

      //User should be able to claim the milestone even if the grant is rejected
      //Since it was already approved
      await grantsManager.connect(secondaryAccount).claimMilestone(proposalId, 1)
      const secondClaimedMilestoneAmount = values[1]
      const receiverBalanceAfterClaiming = await b3tr.balanceOf(secondaryAccount.address)
      const treasuryBalanceAfterClaiming = await b3tr.balanceOf(treasuryAddress)
      const grantsManagerBalanceAfterClaiming = await b3tr.balanceOf(grantsManagerAddress)
      //Receiver balance should increase the exact amount of the claimed milestone
      expect(receiverBalanceAfterClaiming).to.equal(receiverBalanceAfterRejecting + secondClaimedMilestoneAmount)
      //Treasury balance should still be the same
      expect(treasuryBalanceAfterClaiming).to.equal(treasuryBalanceAfterRejecting)
      //Grants manager balance should decrease the exact amount of the claimed milestone
      expect(grantsManagerBalanceAfterClaiming).to.equal(
        grantsManagerBalanceAfterRejecting - secondClaimedMilestoneAmount,
      )
    })
  })
})
