import { describe, it, beforeEach } from "mocha"
import {
  setupProposer,
  validateProposalEvents,
  setupGovernanceFixtureWithEmissions,
  createGrantProposal,
} from "./fixture.test"
import { B3TRGovernor, VOT3, B3TR, Treasury, GrantsManager, TimeLock, VeBetterPassport } from "../../typechain-types"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { ContractFactory, ethers } from "ethers"
import { expect } from "chai"
import {
  bootstrapAndStartEmissions,
  getVot3Tokens,
  payDeposit,
  waitForProposalToBeActive,
  waitForVotingPeriodToEnd,
  waitForNextBlock,
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
    // Setup proposer for all tests
    await setupProposer(proposer, b3tr, vot3, minterAccount)
  })

  // describe("Milestone contract setup", function () {
  //   it("Should set the minimum milestone count", async function () {
  //     const minimumMilestoneCount = await grantsManager.getMinimumMilestoneCount()
  //     expect(minimumMilestoneCount).to.equal(2) // MINIMUM_MILESTONE_COUNT = 2
  //   })

  //   // it("Only b3tr governor or admin can create milestones", async function () {})
  // })

  describe("Milestone creation from grant proposal", function () {
    // it("Should return a proposalId when proposing a grant", async function () {
    //   const description = "Create milestones for my new 1M user DApp"
    //   const depositAmount = 0

    //   const values = [
    //     ethers.parseEther("10000"), // 10 000 B3TR
    //     ethers.parseEther("20000"), // 20 000 B3TR
    //     ethers.parseEther("40000"), // 40 000 B3TR
    //   ]

    //   const tx = await createGrantProposal(owner, grantsManager, treasury, values, proposer, depositAmount, description)
    //   const receipt = await tx.wait()
    //   const { proposalId, decodedProposalCreatedEvent, decodedProposalCreatedWithTypeEvent } =
    //     await validateProposalEvents(governor, receipt, 1, proposer.address, description)

    //   expect(proposalId).to.equal(decodedProposalCreatedEvent.args[0])
    //   expect(proposalId).to.equal(decodedProposalCreatedWithTypeEvent.args[0])
    // })

    it("Proposal Id should be the same as the milestoneId", async function () {
      // setup voter and proposer
      await getVot3Tokens(voter, "70000")

      await veBetterPassport.whitelist(voter.address)
      await veBetterPassport.toggleCheck(1)

      const description = "Create milestones for my new 1M user DApp"
      const depositAmount = 0

      const values = [
        ethers.parseEther("10000"), // 10 000 B3TR
        ethers.parseEther("20000"), // 20 000 B3TR
        ethers.parseEther("40000"), // 40 000 B3TR
      ]
      const totalAmount = ethers.parseEther("70000")

      // create proposal
      const tx = await createGrantProposal(owner, grantsManager, treasury, values, proposer, depositAmount, description)
      const receipt = await tx.wait()

      // checking proposalId
      const { proposalId, decodedProposalCreatedWithTypeEvent } = await validateProposalEvents(
        governor,
        receipt,
        1,
        proposer.address,
        description,
      )

      // Extract the actual parameters used in proposal creation
      const proposalTargets = [...decodedProposalCreatedWithTypeEvent.args[2]]
      const proposalValues = [...decodedProposalCreatedWithTypeEvent.args[3]].map(v => BigInt(v.toString()))
      const proposalCalldatas = [...decodedProposalCreatedWithTypeEvent.args[4]]

      console.log("Proposal targets:", proposalTargets)
      console.log("Proposal values:", proposalValues)
      console.log("Proposal calldatas:", proposalCalldatas)

      // pay deposit
      await payDeposit(proposalId, proposer)
      await waitForProposalToBeActive(proposalId)

      // check proposal state
      let proposalStateToBeActive = await governor.state(proposalId)
      expect(proposalStateToBeActive.toString()).to.eql("1") // active

      // vote
      await governor.connect(voter).castVote(proposalId, 1) // 1 = For, 0 = Against, 2 = Abstain
      await waitForVotingPeriodToEnd(proposalId)

      // check proposal state
      let proposalStateToBeSucceded = await governor.state(proposalId)
      expect(proposalStateToBeSucceded.toString()).to.eql("4") // succeded

      // Queue using the exact same parameters from the proposal creation
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description))

      await governor.queue(proposalTargets, proposalValues, proposalCalldatas, descriptionHash)

      // check proposal state
      let proposalStateToBeQueued = await governor.state(proposalId)
      expect(proposalStateToBeQueued.toString()).to.eql("5") // queued
      await waitForNextBlock()

      // Grant the TimeLock contract the necessary roles
      const timeLockAddress = await governor.timelock()
      await treasury.grantRole(await treasury.GOVERNANCE_ROLE(), timeLockAddress)
      await grantsManager.grantRole(await grantsManager.GOVERNANCE_ROLE(), timeLockAddress)

      // execute proposal
      await governor.execute(proposalTargets, proposalValues, proposalCalldatas, descriptionHash)
      let proposalStateToBeExecuted = await governor.state(proposalId)
      expect(proposalStateToBeExecuted.toString()).to.eql("6") // executed
      console.log("proposalStateToBeExecuted", proposalStateToBeExecuted)

      // check milestone
      const milestone = await grantsManager.getMilestones(proposalId)
      console.log("milestone", milestone)
      expect(milestone.totalAmount.toString()).to.eql(totalAmount.toString())
    })

    // it("Milestone is created only when proposal is executed", async function () {
    //   const description = "Create milestones for my new 1M user DApp"
    //   const depositAmount = 0

    //   const values = [
    //     ethers.parseEther("10000"), // 10 000 B3TR
    //     ethers.parseEther("20000"), // 20 000 B3TR
    //     ethers.parseEther("40000"), // 40 000 B3TR
    //   ]

    //   const tx = await createGrantProposal(owner, grantsManager, treasury, values, proposer, depositAmount, description)
    //   const receipt = await tx.wait()
    //   const { proposalId } = await validateProposalEvents(governor, receipt, 1, proposer.address, description)
    // })

    // it("Calldata should be the same for proposeWithType and createMilestones", async function () {})

    // it("Targets should be the same for proposeWithType and createMilestones", async function () {})

    // it("Values should be the same for proposeWithType and createMilestones", async function () {})

    // it("Description should be the same for proposeWithType and createMilestones", async function () {})

    // it("Recipient should be the same for proposeWithType and createMilestones", async function () {})
    // it("MilestoneID should be the same as the proposalId", async function () {})

    // it("Should change the milestoneId if the description is changed", async function () {})

    // it("Should change the milestoneId if the values are changed", async function () {})
    // it("Should invalidate the creation of the milestone if the proposalId is not equal to the milestoneId", async function () {})

    // it("Milestone id can't be changed or hardcoded", async function () {})
  })

  describe("Milestone deposit", function () {
    it("Should deposit funds for a milestone", async function () {
      // proposer should be able to deposit funds for a milestone and consider in the totalAmount of the milestone
    })
  })
})

// milestones should be this type when calling createMilestone
// not sure about this
//   GovernorTypes.Milestones memory milestones = GovernorTypes.Milestones({
//     milestone: [
//         GovernorTypes.Milestone({
//             amount: milestone1Amount,
//             deadline: deadline1,
//             description: "Upfront payment for the first milestone",// ipfs hash ? to store on metadata ?
//             status: GovernorTypes.MilestoneState.Pending
//         }),
//         GovernorTypes.Milestone({
//             amount: milestone2Amount,
//             deadline: deadline2,
//             description: "First 1000 users to the DApp",// ipfs hash ?
//             status: GovernorTypes.MilestoneState.Pending
//         }),
//         GovernorTypes.Milestone({
//             amount: milestone3Amount,
//             deadline: deadline3,
//             description: "First 1000 users to the DApp",
//             status: GovernorTypes.MilestoneState.Pending
//         })
//     ],
//     totalAmount: milestone1Amount + milestone2Amount + milestone3Amount,
//     claimedAmount: 0,
//     recipient: recipient,
//     id: proposalId
// })

// const milestones = [
//   {
//     amount: "10000000000000000000000",
//     status: 0, // Pending state = 0
//   },
//   {
//     amount: "20000000000000000000000",
//     status: 0,
//   },
//   {
//     amount: "40000000000000000000000",
//     status: 0,
//   },
// ]
