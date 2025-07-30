import { describe, it, beforeEach } from "mocha"
import {
  setupProposer,
  validateProposalEvents,
  setupGovernanceFixtureWithEmissions,
  GRANT_PROPOSAL_TYPE,
} from "./fixture.test"
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
} from "../../typechain-types"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { ethers } from "hardhat"
import { expect } from "chai"
import { ContractFactory, Interface } from "ethers"
import {
  createGrantProposal,
  createProposalWithMultipleFunctionsAndExecuteItGrant,
  getRoundId,
  moveBlocks,
  waitForCurrentRoundToEnd,
} from "../helpers/common"

describe.only("Governance - Milestone Creation", function () {
  let governor: B3TRGovernor
  let vot3: VOT3
  let b3tr: B3TR
  let minterAccount: SignerWithAddress
  let proposer: SignerWithAddress
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
  let contractToPassToMethods: any[]
  let treasuryContract: ContractFactory
  let grantsManagerInterface: Interface
  let governorProposalLogicInterface: Interface
  beforeEach(async function () {
    const fixture = await setupGovernanceFixtureWithEmissions()
    governor = fixture.governor
    vot3 = fixture.vot3
    b3tr = fixture.b3tr
    minterAccount = fixture.minterAccount
    proposer = fixture.proposer
    treasury = fixture.treasury
    grantsManager = fixture.grantsManager
    owner = fixture.owner
    voter = fixture.voter
    veBetterPassport = fixture.veBetterPassport
    timeLock = fixture.timeLock
    emissions = fixture.emissions
    xAllocationVoting = fixture.xAllocationVoting

    // Setup proposer for all tests
    await setupProposer(proposer, b3tr, vot3, minterAccount)

    grantsManagerAddress = await grantsManager.getAddress()
    treasuryAddress = await treasury.getAddress()
    treasuryContract = await ethers.getContractFactory("Treasury")
    contractToPassToMethods = [
      b3tr, //[0]
      vot3, //[1]
      minterAccount, //[2]
      governor, //[3]
      treasury, //[4]
      emissions, //[5]
      xAllocationVoting, //[6]
      veBetterPassport, //[7]
      owner, //[8]
      timeLock, //[9]
      grantsManager, //[10]
    ]

    grantsManagerInterface = GrantsManager__factory.createInterface()
    governorProposalLogicInterface = GovernorProposalLogic__factory.createInterface()
  })

  describe.only("Milestone contract setup and creation", function () {
    it("Should set the minimum milestone count", async function () {
      const minimumMilestoneCount = await grantsManager.getMinimumMilestoneCount()
      expect(minimumMilestoneCount).to.equal(2) // MINIMUM_MILESTONE_COUNT = 2
    })

    it("Should have the correct governor role setup", async function () {
      const governorProxyAddress = await governor.getAddress()

      // Check if the governor proxy has the GOVERNANCE_ROLE
      const GOVERNANCE_ROLE = await grantsManager.GOVERNANCE_ROLE()
      const hasRole = await grantsManager.hasRole(GOVERNANCE_ROLE, governorProxyAddress)
      ;(expect(hasRole).to.be.true, "Governor proxy should have GOVERNANCE_ROLE")

      // Verify that the governor is correctly set in the GrantsManager
      const storedGovernor = await grantsManager.getGovernorContract()
      expect(storedGovernor).to.equal(governorProxyAddress, "GrantsManager should have the correct governor address")
    })

    it("Should not create the proposal if the number of milestones is less than the minimum milestone accepted", async function () {
      const description = "https://ipfs.io/ipfs/Qm..." // project details metadata URI
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later
      const values = [ethers.parseEther("10000")]

      const roundId = await getRoundId(contractToPassToMethods)
      const calldatas = [treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[0]])]

      expect(
        governor.connect(proposer).proposeGrant(
          [treasuryAddress], // Only Treasury targets for transfers
          [0], // transferb3tr is not payable
          calldatas,
          description,
          roundId,
          0,
          milestonesDetailsMetadataURI,
        ),
      ).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "InvalidNumberOfMilestones",
      )
    })

    it("Should not create the proposal if the number of milestones is not equal to the number of values", async function () {
      const description = "https://ipfs.io/ipfs/Qm..." // project details metadata URI cannot be changed later
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later
      const values = [ethers.parseEther("10000"), ethers.parseEther("20000")]

      const roundId = await getRoundId(contractToPassToMethods)
      const calldatas = [treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[0]])]

      expect(
        governor.connect(proposer).proposeGrant(
          [treasuryAddress], // Only Treasury targets for transfers
          [0], // transferb3tr is not payable
          calldatas,
          description,
          roundId,
          0,
          milestonesDetailsMetadataURI,
        ),
      ).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "InvalidNumberOfMilestones",
      )
    })

    it("Should emit MilestonesCreated event when proposal is created", async function () {
      const description = "https://ipfs.io/ipfs/Qm..." // project details metadata URI cannot be changed later
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later
      const values = [ethers.parseEther("10000"), ethers.parseEther("20000")]

      const roundId = await getRoundId(contractToPassToMethods)
      const calldatas = [
        treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[0]]),
        treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[1]]),
      ]

      expect(
        governor.connect(proposer).proposeGrant(
          [treasuryAddress], // Only Treasury for now
          [0n, 0n], // transferb3tr is not payable
          calldatas,
          description,
          roundId,
          0,
          milestonesDetailsMetadataURI,
        ),
      ).to.emit(grantsManager, "MilestonesCreated")
    })

    it("Should create milestones on proposal creation", async function () {
      const description = "https://ipfs.io/ipfs/Qm..." // project details metadata URI cannot be changed later
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later
      const values = [ethers.parseEther("10000"), ethers.parseEther("20000")]
      const totalAmount = values.reduce((a, b) => a + b, 0n)

      const calldatas = [
        treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[0]]),
        treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[1]]),
      ]

      const tx = await createGrantProposal(
        proposer,
        [treasuryAddress, treasuryAddress], // n time = lenght of the calldatas
        calldatas,
        [0n, 0n],
        description,
        0,
        milestonesDetailsMetadataURI,
        contractToPassToMethods,
      )

      const receipt = await tx.wait()

      const { proposalId } = await validateProposalEvents(
        governor,
        receipt,
        Number(GRANT_PROPOSAL_TYPE),
        proposer.address,
        description,
      )

      // Verify milestone data was created during proposal creation
      const storedMilestones = await grantsManager.getMilestones(proposalId)
      expect(storedMilestones.totalAmount).to.equal(totalAmount)
      expect(storedMilestones.proposer).to.equal(proposer.address)
      expect(storedMilestones.milestone.length).to.equal(calldatas.length)
      expect(storedMilestones.milestone[0].amount).to.equal(values[0])
      expect(storedMilestones.milestone[1].amount).to.equal(values[1])
      expect(storedMilestones.milestone[0].status).to.equal(0) // Pending
      expect(storedMilestones.milestone[1].status).to.equal(0) // Pending
      expect(storedMilestones.milestonesDetailsMetadataURI).to.equal(milestonesDetailsMetadataURI)
    })

    it("Cannot create the milestone if the function executable is not transferB3TR", async () => {
      const description = "https://ipfs.io/ipfs/Qm..." // project details metadata URI cannot be changed later
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later
      const values = [ethers.parseEther("10000"), ethers.parseEther("20000")]

      // get the roundId
      const roundId = await getRoundId(contractToPassToMethods)
      const calldatas = [treasury.interface.encodeFunctionData("transferVET", [grantsManagerAddress, values[0]])]

      expect(
        governor.connect(proposer).proposeGrant(
          [treasuryAddress], // Only Treasury for now
          [0], // Transfer total amount
          calldatas,
          description,
          roundId,
          0,
          milestonesDetailsMetadataURI,
        ),
      ).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "InvalidFunctionSelector",
      )
    })

    it("Cannot create milestone if the value passed is 0", async () => {
      const description = "https://ipfs.io/ipfs/Qm..." // project details metadata URI cannot be changed later
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later
      const values = [ethers.parseEther("0")]

      const roundId = await getRoundId(contractToPassToMethods)
      const calldatas = [treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[0]])]

      expect(
        governor.connect(proposer).proposeGrant(
          [treasuryAddress], // Only Treasury for now
          [0], // transferb3tr is not payable
          calldatas,
          description,
          roundId,
          0,
          milestonesDetailsMetadataURI,
        ),
      ).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "InvalidAmount",
      )
    })

    it("Should not create grant proposal with invalid data", async () => {
      const description = "https://ipfs.io/ipfs/Qm..." // project details metadata URI cannot be changed later
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later
      const values = [ethers.parseEther("10000"), ethers.parseEther("20000")]

      const roundId = await getRoundId(contractToPassToMethods)

      // 2 calldatas, but only 1 target -> should revert
      const calldatas = [
        treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[0]]),
        treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[1]]),
      ]
      expect(
        governor.connect(proposer).proposeGrant(
          [treasuryAddress], // Only Treasury for now
          [0], // 2 calldatas, but only 1 value -> should revert
          calldatas,
          description,
          roundId,
          0,
          milestonesDetailsMetadataURI,
        ),
      ).to.be.revertedWithCustomError(
        {
          interface: governorProposalLogicInterface,
        },
        "GovernorInvalidProposalLength",
      )
    })

    it("Should create proposal respecting the minVotingDelay", async () => {
      const description = "https://ipfs.io/ipfs/Qm..." // project details metadata URI cannot be changed later
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later
      const values = [ethers.parseEther("10000"), ethers.parseEther("20000")]
      await governor.setMinVotingDelay(3) // normally set to 1

      await moveBlocks(17)
      let currentBlock = await governor.clock()
      let currentRoundsEndsAt = await xAllocationVoting.currentRoundDeadline()
      let minVotingDelay = await governor.minVotingDelay()
      expect(minVotingDelay).to.be.greaterThan(currentRoundsEndsAt - currentBlock)

      const calldatas = [
        treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[0]]),
        treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[1]]),
      ]

      let voteStartsInRoundId = (await xAllocationVoting.currentRoundId()) + 1n // starts in next round
      expect(
        governor.connect(proposer).proposeGrant(
          [treasuryAddress, treasuryAddress], // Only Treasury for now
          [0, 0], // transferb3tr is not payable
          calldatas,
          description,
          voteStartsInRoundId,
          0,
          milestonesDetailsMetadataURI,
        ),
      ).to.be.revertedWithCustomError(
        {
          interface: governorProposalLogicInterface,
        },
        "GovernorInvalidStartRound",
      )
      // simulate start of new round with enough voting delay
      await waitForCurrentRoundToEnd()
      await emissions.distribute()

      //not moving blocks, so the proposal should be in the next round
      currentBlock = await governor.clock()
      currentRoundsEndsAt = await xAllocationVoting.currentRoundDeadline()
      minVotingDelay = await governor.minVotingDelay()
      expect(minVotingDelay).to.not.be.greaterThan(currentRoundsEndsAt - currentBlock)

      // Now if we create a proposal it should not revert ( within the voting window )
      voteStartsInRoundId = (await xAllocationVoting.currentRoundId()) + 1n // starts in next round

      await governor.connect(proposer).proposeGrant(
        [treasuryAddress, treasuryAddress], // Only Treasury for now
        [0, 0], // transferb3tr is not payable
        calldatas,
        description,
        voteStartsInRoundId,
        0,
        milestonesDetailsMetadataURI,
      )
    })

    it.only("Should not be able to call createMilestone if it's not the governor", async () => {
      const description = "https://ipfs.io/ipfs/Qm..." // project details metadata URI cannot be changed later
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later

      await expect(
        grantsManager
          .connect(owner)
          .createMilestones(description, milestonesDetailsMetadataURI, 0, owner.address, [], {}),
      ).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "NotAuthorized",
      )
    })
  })

  describe("Milestone execution", function () {
    it("Should send the total amount of the proposal from the treasury to the grants manager", async () => {
      const description = "https://ipfs.io/ipfs/Qm..." // project details metadata URI cannot be changed later
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later
      const values = [ethers.parseEther("10000"), ethers.parseEther("20000")]

      const { proposalId } = await createProposalWithMultipleFunctionsAndExecuteItGrant(
        owner, // proposer
        owner, // voter
        [treasury, treasury], // targets ( 2 transfers )
        treasuryContract, // contract to pass to avoid re-deploying the contracts
        description, // description ( will be empty in the proposal, because if modified, the proposalId and milestoneId will be modified => lost in the see)
        ["transferB3TR", "transferB3TR"], // functionToCall
        [
          [grantsManagerAddress, values[0]],
          [grantsManagerAddress, values[1]],
        ], // args of transferb3tr
        "0", // deposit amount
        milestonesDetailsMetadataURI, // milestones
        contractToPassToMethods, // contracts to pass to avoid re-deploying the contracts
      )

      const totalAmountFromProposal = await grantsManager.getTotalAmountForMilestones(proposalId)
      expect(totalAmountFromProposal).to.equal(values.reduce((a, b) => a + b, 0n))

      expect(await b3tr.balanceOf(grantsManagerAddress)).to.equal(totalAmountFromProposal)
    })

    it("Should create a milestone in pending state", async () => {
      const description = "https://ipfs.io/ipfs/Qm..." // project details metadata URI cannot be changed later
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later

      const calldatas = [
        treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, ethers.parseEther("1")]),
        treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, ethers.parseEther("1")]),
      ]

      const roundId = await getRoundId(contractToPassToMethods)
      const tx = await governor.connect(proposer).proposeGrant(
        [treasuryAddress, treasuryAddress], // Only Treasury for now
        [0, 0], // transferb3tr is not payable
        calldatas,
        description,
        roundId,
        0, // depositAmount
        milestonesDetailsMetadataURI,
      )

      const receipt = await tx.wait()
      const { proposalId } = await validateProposalEvents(
        governor,
        receipt,
        Number(GRANT_PROPOSAL_TYPE),
        proposer.address,
        description,
      )

      const milestone = await grantsManager.getMilestone(proposalId, 0)
      expect(milestone.status).to.equal(0)
    })

    it("Once the proposal is executed, the milestone can be validated by the GRANTS_APPROVER_ROLE or the governor", async () => {
      const description = "My new project"
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later

      const { proposalId } = await createProposalWithMultipleFunctionsAndExecuteItGrant(
        owner, // proposer
        owner, // voter
        [treasury, treasury], // targets ( 2 transfers )
        treasuryContract, // contract to pass to avoid re-deploying the contracts
        description, // description ( will be empty in the proposal, because if modified, the proposalId and milestoneId will be modified => lost in the see)
        ["transferB3TR", "transferB3TR"], // functionToCall
        [
          [grantsManagerAddress, ethers.parseEther("1")],
          [grantsManagerAddress, ethers.parseEther("1")],
        ], // args of transferb3tr
        "0", // deposit amount
        milestonesDetailsMetadataURI, // milestones
        contractToPassToMethods, // contracts to pass to avoid re-deploying the contracts
      )

      // try to approve without having the GRANTS_APPROVER_ROLE
      await expect(grantsManager.connect(owner).approveMilestones(proposalId, 0)).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "NotAuthorized",
      )
      // grant owner the approver role
      await grantsManager.grantRole(await grantsManager.GRANTS_APPROVER_ROLE(), owner.address)
      await grantsManager.connect(owner).approveMilestones(proposalId, 0)
      const milestonseRegistered = await grantsManager.getMilestone(proposalId, 0) // the first one should be validated
      expect(milestonseRegistered.status).to.equal(1) // Validated
      expect(milestonseRegistered.amount).to.equal(ethers.parseEther("1"))

      // other milestone should be pending
      const milestonseRegistered2 = await grantsManager.getMilestone(proposalId, 1) // the second one should be pending
      expect(milestonseRegistered2.status).to.equal(0) // Pending
    })

    it("Should not be able to validate the milestone if the proposal is not executed or did not pass the deposit or voting threshold", async () => {
      const description = "My new project"
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later

      // set to 1 milestone for simplicity
      await grantsManager.setMinimumMilestoneCount(1)

      const roundId = await getRoundId(contractToPassToMethods)
      const tx = await governor.connect(proposer).proposeGrant(
        [treasuryAddress], // Only Treasury for now
        [0], // transferb3tr is not payable
        [treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, ethers.parseEther("1")])],
        description,
        roundId,
        0,
        milestonesDetailsMetadataURI,
      )
      const receipt = await tx.wait()

      const { proposalId } = await validateProposalEvents(
        governor,
        receipt,
        Number(GRANT_PROPOSAL_TYPE),
        proposer.address,
        description,
      )
      const milestone = await grantsManager.getMilestone(proposalId, 0)
      expect(milestone.status).to.equal(0) // Pending

      // grant owner the approver role
      await grantsManager.grantRole(await grantsManager.GRANTS_APPROVER_ROLE(), owner.address)
      await expect(grantsManager.connect(owner).approveMilestones(proposalId, 0)).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "ProposalNotQueuedOrExecuted",
      )
    })

    it("Only admin can approve the milestones", async () => {
      const description = "My new project"
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later

      // set to 1 milestone for simplicity
      await grantsManager.setMinimumMilestoneCount(1)

      const roundId = await getRoundId(contractToPassToMethods)
      const tx = await governor.connect(proposer).proposeGrant(
        [treasuryAddress], // Only Treasury for now
        [0], // transferb3tr is not payable
        [treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, ethers.parseEther("1")])],
        description,
        roundId,
        0,
        milestonesDetailsMetadataURI,
      )
      const receipt = await tx.wait()

      const { proposalId } = await validateProposalEvents(
        governor,
        receipt,
        Number(GRANT_PROPOSAL_TYPE),
        proposer.address,
        description,
      )

      // grant owner the approver role
      await grantsManager.grantRole(await grantsManager.GRANTS_APPROVER_ROLE(), owner.address)
      await expect(grantsManager.connect(voter).approveMilestones(proposalId, 0)).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "NotAuthorized",
      )
    })

    it("Milestone should be claimed by the proposal owner once the proposal is executed and the milestone is validated", async () => {
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
        milestonesDetailsMetadataURI, // milestones
        contractToPassToMethods, // contracts to pass to avoid re-deploying the contracts
      )

      const balanceBeforeClaiming = await b3tr.balanceOf(proposer.address)

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
      await expect(grantsManager.connect(voter).claimMilestone(proposalId, 0)).to.be.revertedWithCustomError(
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
        "PreviousMilestoneNotValidated",
      )

      // approve with the correct role
      await grantsManager.connect(owner).approveMilestones(proposalId, 0)
      // try to claim with someone else than the proposal owner
      await expect(grantsManager.connect(voter).claimMilestone(proposalId, 0)).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "CallerIsNotTheGrantProposer",
      )

      // try to claim the 2nd milestone before approving the first one
      await expect(grantsManager.connect(voter).claimMilestone(proposalId, 1)).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "MilestoneNotApprovedByAdmin",
      )

      // approve the milestone
      // claim the milestone with the correct role
      await grantsManager.connect(proposer).claimMilestone(proposalId, 0)

      // check the state of the milestone 0
      const milestone0 = await grantsManager.getMilestone(proposalId, 0)
      expect(milestone0.status).to.equal(2) // Claimed

      // approve the second milestone
      await grantsManager.connect(owner).approveMilestones(proposalId, 1)
      // claim the second milestone
      await grantsManager.connect(proposer).claimMilestone(proposalId, 1)

      const balanceAfterClaiming = await b3tr.balanceOf(proposer.address)
      expect(balanceAfterClaiming).to.equal(balanceBeforeClaiming + ethers.parseEther("20000"))
    })

    it("Cannot claim twice the same milestone", async () => {
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
        milestonesDetailsMetadataURI, // milestones
        contractToPassToMethods, // contracts to pass to avoid re-deploying the contracts
      )

      // approve the milestone
      await grantsManager.connect(owner).approveMilestones(proposalId, 0)
      // claim the milestone
      await grantsManager.connect(proposer).claimMilestone(proposalId, 0)
      // claim the milestone again
      await expect(grantsManager.connect(proposer).claimMilestone(proposalId, 0)).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "MilestoneAlreadyClaimed",
      )
    })
  })

  describe("Proposal and milestone description modification", function () {
    it("Cannot create milestone if the milestone details metadata URI is empty", async () => {
      const description = "My new project"
      const milestonesDetailsMetadataURI = ""
      const values = [ethers.parseEther("10000"), ethers.parseEther("10000")]

      const roundId = await getRoundId(contractToPassToMethods)
      const calldatas = [treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[0]])]

      expect(
        governor.connect(proposer).proposeGrant(
          [treasuryAddress], // Only Treasury for now
          [0], // transferb3tr is not payable
          calldatas,
          description,
          roundId,
          0,
          milestonesDetailsMetadataURI,
        ),
      ).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "MilestoneDetailsMetadataURIEmpty",
      )
    })

    it("Cannot create milestone if the project details metadata URI is empty", async () => {
      const description = "" // project details metadata URI cannot be changed later
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later

      const roundId = await getRoundId(contractToPassToMethods)
      const calldatas = [
        treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, ethers.parseEther("1")]),
      ]

      expect(
        governor.connect(proposer).proposeGrant(
          [treasuryAddress], // Only Treasury for now
          [0], // transferb3tr is not payable
          calldatas,
          description,
          roundId,
          0,
          milestonesDetailsMetadataURI,
        ),
      ).to.be.revertedWithCustomError(
        {
          interface: grantsManagerInterface,
        },
        "ProjectDetailsMetadataURIEmpty",
      )
    })

    it("Should be able to update the milestone details metadata URI", async () => {
      const description = "My new project"
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later
      const newMilestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qp..." // milestones details can be changed later

      const roundId = await getRoundId(contractToPassToMethods)
      const calldatas = [
        treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, ethers.parseEther("1")]),
      ]

      // set to 1 milestone for simplicity
      await grantsManager.setMinimumMilestoneCount(1)

      const tx = await governor.connect(proposer).proposeGrant(
        [treasuryAddress], // Only Treasury for now
        [0], // transferb3tr is not payable
        calldatas,
        description,
        roundId,
        0,
        milestonesDetailsMetadataURI,
      )

      const receipt = await tx.wait()
      const { proposalId } = await validateProposalEvents(
        governor,
        receipt,
        Number(GRANT_PROPOSAL_TYPE),
        proposer.address,
        description,
      )

      await grantsManager
        .connect(proposer)
        .updateMilestoneDescriptionMetadataURI(proposalId, newMilestonesDetailsMetadataURI)

      const milestones = await grantsManager.getMilestones(proposalId)
      expect(milestones.milestonesDetailsMetadataURI).to.equal(newMilestonesDetailsMetadataURI)
    })
  })

  describe("Milestone deposit", function () {
    it("Proposer should be able to deposit funds for its own proposal", async function () {
      // proposer should be able to deposit funds for a milestone and consider in the totalAmount of the milestone
      const description = "My new project"
      const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm..." // milestones details can be changed later s

      const balanceBeforeDeposit = await b3tr.balanceOf(proposer.address)
      await b3tr.connect(minterAccount).mint(proposer.address, ethers.parseEther("1000"))
      await b3tr.connect(proposer).approve(await vot3.getAddress(), ethers.parseEther("1000"))
      await vot3.connect(proposer).convertToVOT3(ethers.parseEther("1000"), { gasLimit: 10_000_000 })

      const { proposalId } = await createProposalWithMultipleFunctionsAndExecuteItGrant(
        proposer, // proposer
        owner, // voter
        [treasury, treasury], // targets ( 3 transfers )
        treasuryContract, // contract to pass to avoid re-deploying the contracts
        description, // description ( will be empty in the proposal, because if modified, the proposalId and milestoneId will be modified => lost in the see)
        ["transferB3TR", "transferB3TR"], // functionToCall
        [
          [grantsManagerAddress, ethers.parseEther("1")],
          [grantsManagerAddress, ethers.parseEther("1")],
        ], // args of transferb3tr( should have a revert if the amount is not equal)
        ethers.parseEther("1"), // deposit amount
        milestonesDetailsMetadataURI, // milestones
        contractToPassToMethods, // contracts to pass to avoid re-deploying the contracts
      )
      // check the state of the milestone
      const milestone = await grantsManager.getMilestone(proposalId, 0)
      expect(milestone.status).to.equal(2) // Claimed
      // check the balance of the proposer
      const balanceAfterDeposit2 = await b3tr.balanceOf(proposer.address)
      expect(balanceAfterDeposit2).to.equal(balanceBeforeDeposit - ethers.parseEther("1"))
      // check the balance of the grants manager
      const balanceAfterDeposit3 = await b3tr.balanceOf(grantsManagerAddress)
      expect(balanceAfterDeposit3).to.equal(balanceBeforeDeposit + ethers.parseEther("1"))
    })
  })
})
