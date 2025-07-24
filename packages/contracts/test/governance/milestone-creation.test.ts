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
} from "../../typechain-types"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { ethers } from "hardhat"
import { expect } from "chai"
import { ContractFactory } from "ethers"
import {
  createGrantProposal,
  createProposalWithMultipleFunctionsAndExecuteItGrant,
  getRoundId,
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
  })

  //ok
  describe.only("Milestone contract setup and creation", function () {
    it("Should set the minimum milestone count", async function () {
      const minimumMilestoneCount = await grantsManager.getMinimumMilestoneCount()
      expect(minimumMilestoneCount).to.equal(2) // MINIMUM_MILESTONE_COUNT = 2
    })

    it.only("Should not create the proposal if the number of milestones is less than the minimum milestone accepted", async function () {
      const description = "https://ipfs.io/ipfs/Qm..." // project details metadata URI
      const values = [ethers.parseEther("10000")]
      const totalAmount = ethers.parseEther("10000")

      const milestones = {
        id: 0, // proposalId = 0 at the beginning
        totalAmount: totalAmount,
        claimedAmount: 0n,
        recipient: proposer.address,
        milestone: [], // Empty milestone array should fail
        milestonesDetailsMetadataURI: "https://ipfs.io/ipfs/Qm...", // Add   the required field
      }

      const roundId = await getRoundId(contractToPassToMethods)

      expect(
        governor.connect(proposer).proposeGrant(
          [treasuryAddress], // Only Treasury targets for transfers
          [0], // transferb3tr is not payable
          [treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[0]])],
          description,
          roundId,
          0,
          milestones.milestonesDetailsMetadataURI,
        ),
      ).to.be.revertedWithCustomError(
        {
          interface: GrantsManager__factory.createInterface(),
        },
        "InvalidNumberOfMilestones",
      )
    })

    it("Should not create the proposal if the number of milestones is not equal to the number of values", async function () {
      const description = "Create milestones for my new 1M user DApp"
      const values = [ethers.parseEther("10000"), ethers.parseEther("20000")]
      const totalAmount = values.reduce((a, b) => a + b, 0n)

      const milestones = {
        id: 0, // proposalId = 0 at the beginning
        totalAmount: totalAmount,
        claimedAmount: 0n,
        recipient: proposer.address,
        milestone: [
          // Only one milestone for 2 registered values
          {
            amount: values[0],
            status: 0, // Pending
          },
        ], // Empty milestone array should fail
        descriptionHash: ethers.keccak256(ethers.toUtf8Bytes(description)),
        milestonesDetailsMetadataURI: "https://ipfs.io/ipfs/Qm...", // Add the required field
      }

      const roundId = await getRoundId(contractToPassToMethods)

      expect(
        governor.connect(proposer).proposeGrant(
          [treasuryAddress], // Only Treasury targets for transfers
          [0], // transferb3tr is not payable
          [treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[0]])],
          description,
          roundId,
          0,
          milestones.milestonesDetailsMetadataURI,
        ),
      ).to.be.revertedWithCustomError(
        {
          interface: GrantsManager__factory.createInterface(),
        },
        "InvalidNumberOfMilestones",
      )
    })

    it("Should emit MilestonesCreated event when proposal is created", async function () {
      const description = "https://ipfs.io/ipfs/Qm..." // project details metadata URI
      const values = [ethers.parseEther("10000"), ethers.parseEther("20000")]
      const totalAmount = values.reduce((a, b) => a + b, 0n)

      const milestoneArray = values.map(amount => ({
        amount: amount,
        status: 0, // Pending
      }))

      const milestones = {
        id: 0, // proposalId = 0 at the beginning
        totalAmount: totalAmount,
        claimedAmount: 0n,
        recipient: proposer.address,
        milestone: milestoneArray,
        milestonesDetailsMetadataURI: "https://ipfs.io/ipfs/Qm...", // project details metadata URI
      }

      const roundId = await getRoundId(contractToPassToMethods)

      const calldatas = [
        treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[0]]),
        treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[1]]),
      ]

      expect(
        governor.connect(proposer).proposeGrant(
          [treasuryAddress], // Only Treasury for now
          [0], // transferb3tr is not payable
          calldatas,
          description,
          roundId,
          0,
          milestones,
        ),
      ).to.emit(grantsManager, "MilestonesCreated")
    })

    it.only("Should create milestones on proposal creation", async function () {
      const description = "https://ipfs.io/ipfs/Qm..." // project details metadata URI
      const values = [ethers.parseEther("10000"), ethers.parseEther("20000")] // 2 milestones minimum set in the contract
      const totalAmount = values.reduce((a, b) => a + b, 0n)

      // Milestone array storing the amount and status of each of them
      const milestone = values.map(amount => ({
        amount: amount,
        status: 0, // Pending
      }))

      const milestones = {
        id: 0, // proposalId = 0 at the beginning
        totalAmount: totalAmount,
        claimedAmount: 0n,
        recipient: proposer.address,
        milestone,
        milestonesDetailsMetadataURI: "https://ipfs.io/ipfs/Qm...",
      }

      const calldatas = [
        treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[0]]),
        treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[1]]),
      ]
      const tx = await createGrantProposal(
        proposer,
        [treasuryAddress, treasuryAddress],
        calldatas,
        [0n, 0n],
        description,
        0,
        milestones,
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
      expect(storedMilestones.milestonesDetailsMetadataURI).to.equal(milestones.milestonesDetailsMetadataURI)
    })

    it("Cannot create the milestone if it is missing one of the required fields of the Milestone", async () => {
      const description = "https://ipfs.io/ipfs/Qm..." // project details metadata URI
      const values = [ethers.parseEther("10000"), ethers.parseEther("20000")]
      const totalAmount = values.reduce((a, b) => a + b, 0n)

      const milestone = values.map(amount => ({
        amount: amount,
        status: 0, // Pending
      }))

      const milestones = {
        id: 0, // proposalId = 0 at the beginning
        totalAmount: totalAmount,
        claimedAmount: 0n,
        recipient: "0x0000000000000000000000000000000000000000", // passing an empty string should fail
        milestone,
        milestonesDetailsMetadataURI: "https://ipfs.io/ipfs/Qm...",
      }

      // get the roundId
      const roundId = await getRoundId(contractToPassToMethods)

      expect(
        governor.connect(proposer).proposeGrant(
          [treasuryAddress], // Only Treasury for now
          [0], // Transfer total amount
          [treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, totalAmount])],
          description,
          roundId,
          0,
          milestones,
        ),
      ).to.be.revertedWithCustomError(
        {
          interface: GrantsManager__factory.createInterface(),
        },
        "MilestoneRecipientZeroAddress",
      )
    })

    it("Should create milestone with the correct total amount", async () => {
      const description = "My new project"
      const totalAmount = ethers.parseEther("2")

      const milestone = [
        {
          amount: ethers.parseEther("1"),
          status: 0, // Pending
        },
      ]

      const milestones = {
        id: 0, // proposalId = 0 at the beginning
        totalAmount: totalAmount,
        claimedAmount: 0n,
        recipient: proposer.address,
        milestone,
        milestonesDetailsMetadataURI: "https://ipfs.io/ipfs/Qm...",
      }

      const roundId = await getRoundId(contractToPassToMethods)

      expect(
        governor.connect(proposer).proposeGrant(
          [treasuryAddress], // Only Treasury for now
          [0], // transferb3tr is not payable
          [treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, totalAmount])],
          description,
          roundId,
          0,
          milestones,
        ),
      ).to.be.revertedWithCustomError(
        {
          interface: GrantsManager__factory.createInterface(),
        },
        "MilestoneTotalAmountMismatch",
      )
    })
  })

  describe("Milestone execution", function () {
    it("Should send the total amount of the proposal from the treasury to the grants manager", async () => {
      const description = "My new project"
      const totalAmount = ethers.parseEther("2")

      const milestone = [
        {
          amount: ethers.parseEther("1"),
          status: 0, // Pending
        },
        {
          amount: ethers.parseEther("1"),
          status: 0, // Pending
        },
      ]

      const milestones = {
        id: 0, // proposalId = 0 at the beginning
        totalAmount: totalAmount,
        claimedAmount: 0n,
        recipient: proposer.address,
        milestone,
        milestonesDetailsMetadataURI: "https://ipfs.io/ipfs/Qm...",
      }

      await createProposalWithMultipleFunctionsAndExecuteItGrant(
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
        milestones, // milestones
        contractToPassToMethods, // contracts to pass to avoid re-deploying the contracts
      )

      expect(await b3tr.balanceOf(grantsManagerAddress)).to.equal(ethers.parseEther("2"))
    })

    // test that the total amount is correct if above, the sum of the values is not equal to the total amount
    it("Cannot create a milestone with state different than pending", async () => {
      const description = "My new project"
      const totalAmount = ethers.parseEther("2")
      const milestone = [
        {
          amount: ethers.parseEther("1"),
          status: 1, // Validated
        },
        {
          amount: ethers.parseEther("1"),
          status: 0, // Pending
        },
      ]
      const milestones = {
        id: 0, // proposalId = 0 at the beginning
        totalAmount: totalAmount,
        claimedAmount: 0n,
        recipient: proposer.address,
        milestone,
        milestonesDetailsMetadataURI: "https://ipfs.io/ipfs/Qm...",
      }

      expect(
        governor.connect(proposer).proposeGrant(
          [treasuryAddress], // Only Treasury for now
          [0, 0], // transferb3tr is not payable
          [
            treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, ethers.parseEther("1")]),
            treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, ethers.parseEther("1")]),
          ],
          description,
          1, // startRoundId
          0, // depositAmount
          milestones,
        ),
      ).to.be.revertedWithCustomError(
        {
          interface: GrantsManager__factory.createInterface(),
        },
        "MilestoneStateNotPending",
      )
    })

    it("Once the proposal is executed, the milestone can be validated by the admin or the grantsManager", async () => {
      const description = "My new project"
      const totalAmount = ethers.parseEther("2")

      const milestone = [
        {
          amount: ethers.parseEther("1"),
          status: 0, // Pending
        },
        {
          amount: ethers.parseEther("1"),
          status: 0, // Pending
        },
      ]
      const milestones = {
        id: 0, // proposalId = 0 at the beginning
        totalAmount: totalAmount,
        claimedAmount: 0n,
        recipient: proposer.address,
        milestone,
        milestonesDetailsMetadataURI: "https://ipfs.io/ipfs/Qm...",
      }

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
        milestones, // milestones
        contractToPassToMethods, // contracts to pass to avoid re-deploying the contracts
      )

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
      const totalAmount = ethers.parseEther("1")
      // set to 1 milestone for simplicity
      await grantsManager.setMinimumMilestoneCount(1)
      const milestones = {
        id: 0, // proposalId = 0 at the beginning
        totalAmount: totalAmount,
        claimedAmount: 0n,
        recipient: proposer.address,
        milestone: [
          {
            amount: ethers.parseEther("1"),
            status: 0, // Pending
          },
        ],
        milestonesDetailsMetadataURI: "https://ipfs.io/ipfs/Qm...",
      }

      const roundId = await getRoundId(contractToPassToMethods)
      const tx = await governor.connect(proposer).proposeGrant(
        [treasuryAddress], // Only Treasury for now
        [0], // transferb3tr is not payable
        [treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, ethers.parseEther("1")])],
        description,
        roundId,
        0,
        milestones,
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

      await expect(grantsManager.connect(owner).approveMilestones(proposalId, 0)).to.be.revertedWithCustomError(
        {
          interface: GrantsManager__factory.createInterface(),
        },
        "ProposalNotQueuedOrExecuted",
      )
    })

    it("Only owner or the grantsManager can approve the milestones", async () => {
      const description = "My new project"
      const totalAmount = ethers.parseEther("1")

      // set to 1 milestone for simplicity
      await grantsManager.setMinimumMilestoneCount(1)
      const milestones = {
        id: 0, // proposalId = 0 at the beginning
        totalAmount: totalAmount,
        claimedAmount: 0n,
        recipient: proposer.address,
        milestone: [
          {
            amount: ethers.parseEther("1"),
            status: 0, // Pending
          },
        ],
        milestonesDetailsMetadataURI: "https://ipfs.io/ipfs/Qm...",
      }
      const roundId = await getRoundId(contractToPassToMethods)
      const tx = await governor.connect(proposer).proposeGrant(
        [treasuryAddress], // Only Treasury for now
        [0], // transferb3tr is not payable
        [treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, ethers.parseEther("1")])],
        description,
        roundId,
        0,
        milestones,
      )
      const receipt = await tx.wait()

      const { proposalId } = await validateProposalEvents(
        governor,
        receipt,
        Number(GRANT_PROPOSAL_TYPE),
        proposer.address,
        description,
      )

      await expect(grantsManager.connect(voter).approveMilestones(proposalId, 0)).to.be.revertedWithCustomError(
        {
          interface: GrantsManager__factory.createInterface(),
        },
        "NotAuthorized",
      )
    })

    it.only("Milestone should be claimed by the proposal owner once the proposal is executed and the milestone is validated", async () => {
      const description = "My new project"
      const totalAmount = ethers.parseEther("20000")
      const proposerAddress = await proposer.getAddress()
      const values = [ethers.parseEther("10000"), ethers.parseEther("10000")]

      // set to 1 milestone for simplicity
      const milestones = {
        id: 0, // proposalId = 0 at the beginning
        totalAmount: totalAmount,
        claimedAmount: 0n,
        recipient: proposerAddress,
        milestone: [
          {
            amount: values[0],
            status: 0, // Pending
          },
          {
            amount: values[1],
            status: 0, // Pending
          },
        ],
        milestonesDetailsMetadataURI: "https://ipfs.io/ipfs/Qm...",
      }

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
        milestones, // milestones
        contractToPassToMethods, // contracts to pass to avoid re-deploying the contracts
      )

      const balanceBeforeClaiming = await b3tr.balanceOf(proposer.address)

      // try to approve with someone else than the governor roles
      await expect(grantsManager.connect(proposer).approveMilestones(proposalId, 0)).to.be.revertedWithCustomError(
        {
          interface: GrantsManager__factory.createInterface(),
        },
        "NotAuthorized",
      )
      // try to claim will it have not been approve by any governor role
      await expect(grantsManager.connect(voter).claimMilestone(proposalId, 0)).to.be.revertedWithCustomError(
        {
          interface: GrantsManager__factory.createInterface(),
        },
        "MilestoneNotApprovedByAdmin",
      )

      // try to approve the 2nd milestone before approving the first one
      await expect(grantsManager.connect(owner).approveMilestones(proposalId, 1)).to.be.revertedWithCustomError(
        {
          interface: GrantsManager__factory.createInterface(),
        },
        "PreviousMilestoneNotValidated",
      )

      // approve with the correct role
      await grantsManager.connect(owner).approveMilestones(proposalId, 0)
      // try to claim with someone else than the proposal owner
      await expect(grantsManager.connect(voter).claimMilestone(proposalId, 0)).to.be.revertedWithCustomError(
        {
          interface: GrantsManager__factory.createInterface(),
        },
        "CallerIsNotTheGrantProposer",
      )

      // try to claim the 2nd milestone before approving the first one
      await expect(grantsManager.connect(voter).claimMilestone(proposalId, 1)).to.be.revertedWithCustomError(
        {
          interface: GrantsManager__factory.createInterface(),
        },
        "MilestoneNotApprovedByAdmin",
      )

      // approve the milestone
      // claim the milestone with the correct role
      await grantsManager.connect(proposer).claimMilestone(proposalId, 0)

      // check the state of the milestone 0
      const milestone0 = await grantsManager.getMilestone(proposalId, 0)
      console.log("milestone0.status", milestone0.status)
      expect(milestone0.status).to.equal(2) // Claimed

      // approve the second milestone
      await grantsManager.connect(owner).approveMilestones(proposalId, 1)
      // claim the second milestone
      await grantsManager.connect(proposer).claimMilestone(proposalId, 1)

      const balanceAfterClaiming = await b3tr.balanceOf(proposer.address)
      expect(balanceAfterClaiming).to.equal(balanceBeforeClaiming + ethers.parseEther("20000"))
    })

    it.only("Cannot claim twice the same milestone", async () => {
      const description = "My new project"
      const totalAmount = ethers.parseEther("20000")
      const proposerAddress = await proposer.getAddress()
      const values = [ethers.parseEther("10000"), ethers.parseEther("10000")]

      const milestones = {
        id: 0, // proposalId = 0 at the beginning
        totalAmount: totalAmount,
        claimedAmount: 0n,
        recipient: proposerAddress,
        milestone: [
          {
            amount: values[0],
            status: 0, // Pending
          },
          {
            amount: values[1],
            status: 0, // Pending
          },
        ],
        milestonesDetailsMetadataURI: "https://ipfs.io/ipfs/Qm...",
      }

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
        milestones, // milestones
        contractToPassToMethods, // contracts to pass to avoid re-deploying the contracts
      )

      // approve the milestone
      await grantsManager.connect(owner).approveMilestones(proposalId, 0)
      // claim the milestone
      await grantsManager.connect(proposer).claimMilestone(proposalId, 0)
      // claim the milestone again
      await expect(grantsManager.connect(proposer).claimMilestone(proposalId, 0)).to.be.revertedWithCustomError(
        {
          interface: GrantsManager__factory.createInterface(),
        },
        "MilestoneAlreadyClaimed",
      )
    })
  })

  // the description will be an ipns hash, so that, even if the description is changed, the proposalId and milestoneId will be the same
  describe("Proposal and milestone description modification", function () {
    // it should change the proposal description, without changing the ipns hash
    // it should update the milestone description ( data, amount)
    // it should not change the milestone status
  })

  describe("Milestone deposit", function () {
    // it.only("Proposer should be able to deposit funds for its own proposal", async function () {
    //   // proposer should be able to deposit funds for a milestone and consider in the totalAmount of the milestone
    //   const description = "My new project"
    //   const totalAmount = ethers.parseEther("2")
    //   const milestones = {
    //     id: 0, // proposalId = 0 at the beginning
    //     totalAmount: totalAmount,
    //     claimedAmount: 0n,
    //     recipient: proposer.address,
    //     milestone: [
    //       {
    //         amount: ethers.parseEther("1"),
    //         status: 0, // Pending
    //       },
    //       {
    //         amount: ethers.parseEther("1"),
    //         status: 0, // Pending
    //       },
    //     ],
    //     milestonesDetailsMetadataURI: "https://ipfs.io/ipfs/Qm...",
    //   }
    //   const balanceBeforeDeposit = await b3tr.balanceOf(proposer.address)
    //   // increase allowance for the proposer
    //   await b3tr.connect(proposer).approve(grantsManagerAddress, ethers.parseEther("10000"))
    //   const { proposalId } = await createProposalWithMultipleFunctionsAndExecuteItGrant(
    //     proposer, // proposer
    //     owner, // voter
    //     [treasury, treasury], // targets ( 3 transfers )
    //     treasuryContract, // contract to pass to avoid re-deploying the contracts
    //     description, // description ( will be empty in the proposal, because if modified, the proposalId and milestoneId will be modified => lost in the see)
    //     ["transferB3TR", "transferB3TR"], // functionToCall
    //     [
    //       [grantsManagerAddress, ethers.parseEther("1")],
    //       [grantsManagerAddress, ethers.parseEther("1")],
    //     ], // args of transferb3tr( should have a revert if the amount is not equal)
    //     ethers.parseEther("1"), // deposit amount
    //     milestones, // milestones
    //     contractToPassToMethods, // contracts to pass to avoid re-deploying the contracts
    //   )
    //   // check the state of the milestone
    //   const milestone = await grantsManager.getMilestone(proposalId, 0)
    //   expect(milestone.status).to.equal(2) // Claimed
    //   // check the balance of the proposer
    //   const balanceAfterDeposit2 = await b3tr.balanceOf(proposer.address)
    //   expect(balanceAfterDeposit2).to.equal(balanceBeforeDeposit - ethers.parseEther("1"))
    //   // check the balance of the grants manager
    //   const balanceAfterDeposit3 = await b3tr.balanceOf(grantsManagerAddress)
    //   expect(balanceAfterDeposit3).to.equal(balanceBeforeDeposit + ethers.parseEther("1"))
    // })
  })
})
