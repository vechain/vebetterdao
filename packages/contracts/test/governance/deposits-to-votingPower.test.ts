import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import {
  setupGovernanceFixtureWithEmissions,
  setupProposer,
  setupVoter,
  STANDARD_PROPOSAL_TYPE,
  startNewRoundAndGetRoundId,
} from "./fixture.test"
import {
  VOT3,
  B3TR,
  X2EarnApps,
  XAllocationVoting,
  VeBetterPassport,
  Emissions,
  B3TRGovernor,
} from "../../typechain-types"
import { ethers } from "hardhat"
import {
  getRoundId,
  moveBlocks,
  startNewAllocationRound,
  getProposalIdFromTx,
  getVot3Tokens,
  waitForCurrentRoundToEnd,
  waitForNextBlock,
  payDeposit,
} from "../helpers/common"
import { endorseApp } from "../helpers/xnodes"
import { describe, it, beforeEach } from "mocha"
import { expect } from "chai"

describe.only("Voting power with proposal deposit", function () {
  let vot3: VOT3
  let b3tr: B3TR
  let minterAccount: SignerWithAddress
  let proposer: SignerWithAddress
  let creator: SignerWithAddress[]
  let x2EarnApps: X2EarnApps
  let xAllocationVoting: XAllocationVoting
  let voter: SignerWithAddress
  let veBetterPassport: VeBetterPassport
  let owner: SignerWithAddress
  let emissions: Emissions
  let governor: B3TRGovernor
  beforeEach(async function () {
    const fixture = await setupGovernanceFixtureWithEmissions()
    vot3 = fixture.vot3
    b3tr = fixture.b3tr
    minterAccount = fixture.minterAccount
    proposer = fixture.proposer
    creator = fixture.creators
    x2EarnApps = fixture.x2EarnApps
    xAllocationVoting = fixture.xAllocationVoting
    voter = fixture.voter
    veBetterPassport = fixture.veBetterPassport
    owner = fixture.owner
    emissions = fixture.emissions
    governor = fixture.governor

    // Setup proposer for all tests
    await setupProposer(proposer, b3tr, vot3, minterAccount)
  })

  describe.only("Backward compatibility", function () {
    it.only("Should be able to vote in xApps allocation without proposal deposit if no deposit is done", async function () {
      await setupVoter(voter, b3tr, vot3, minterAccount, owner, veBetterPassport)
      // submit app
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(creator[0].address))

      await x2EarnApps
        .connect(owner)
        .submitApp(creator[0].address, creator[0].address, creator[0].address, "metadataURI")

      await endorseApp(app1Id, voter)

      await vot3.connect(voter).delegate(voter.address)
      await moveBlocks(2)
      const round1 = await startNewAllocationRound({
        emissions,
        xAllocationVoting,
        minterAccount,
      })

      await xAllocationVoting.connect(voter).castVote(round1, [app1Id], [ethers.parseEther("100")])

      // Check the voting power
      const roundSnapshot = await xAllocationVoting.roundSnapshot(round1)
      const votingPower = await xAllocationVoting.getVotes(voter.address, roundSnapshot)
      expect(votingPower).to.equal(ethers.parseEther("10000")) // 10000 because we had 10000 vot3 tokens at snapshot
    })

    it.only("Should be able to vote on allocation with the proposal deposit", async function () {
      //Submit the app
      await x2EarnApps
        .connect(owner)
        .submitApp(creator[0].address, creator[0].address, creator[0].address, "metadataURI")

      //Setup voter + start new round
      await setupVoter(voter, b3tr, vot3, minterAccount, owner, veBetterPassport)

      const expectedVot3Balance = ethers.parseEther("10000")
      expect(await vot3.balanceOf(voter.address)).to.equal(expectedVot3Balance)

      //Get the deposit threshold for the proposal type
      const depositThreshold = await governor.depositThresholdByProposalType(STANDARD_PROPOSAL_TYPE)

      //Get user the balance of deposit
      await getVot3Tokens(voter, ethers.formatEther(depositThreshold))

      const expectedVot3BalanceBeforeDeposit = expectedVot3Balance + depositThreshold
      expect(await vot3.balanceOf(voter.address)).to.equal(expectedVot3BalanceBeforeDeposit)

      //Start emissions
      await emissions.connect(minterAccount).start()

      //Round 2
      const roundIdBeforeVotesDeposit = await xAllocationVoting.currentRoundId()

      //Allowance for the deposit
      await vot3.connect(voter).approve(await governor.getAddress(), depositThreshold)

      // Create the proposal
      const tx = await governor
        .connect(voter)
        .propose(
          [await b3tr.getAddress()],
          [0],
          [(await ethers.getContractFactory("B3TR")).interface.encodeFunctionData("tokenDetails", [])],
          `${this?.test?.title}`,
          (Number(roundIdBeforeVotesDeposit) + 2).toString(),
          0,
          {
            gasLimit: 10_000_000,
          },
        )

      //Deposit into the proposal the exact threshold
      await tx.wait()
      const proposalId = await getProposalIdFromTx(tx, false, { governor })

      const txForDeposit = await governor.connect(voter).deposit(depositThreshold, proposalId)
      await txForDeposit.wait()

      //Wait for round to end
      await waitForCurrentRoundToEnd({ xAllocationVoting })
      await waitForNextBlock()
      await waitForNextBlock()

      //Start new round
      await startNewAllocationRound({
        emissions,
        xAllocationVoting,
        minterAccount,
      })

      await waitForNextBlock()

      const roundIdAfterVotesDeposit = await xAllocationVoting.currentRoundId()
      const roundSnapshotBeforeVotes = await xAllocationVoting.roundSnapshot(roundIdBeforeVotesDeposit)
      const roundSnapshotAfterVotes = await xAllocationVoting.roundSnapshot(roundIdAfterVotesDeposit)

      const votingPowerForAllocationAfterVotes = await xAllocationVoting.getVotes(
        voter.address,
        roundSnapshotAfterVotes,
      )

      const depositvotingpowerInAllocationBeforeVotes = await xAllocationVoting.getDepositVotingPower(
        voter.address,
        roundSnapshotBeforeVotes,
      )
      const depositvotingpowerInGovernorBeforeVotes = await governor.getDepositVotingPower(
        voter.address,
        roundSnapshotBeforeVotes,
      )

      const depositvotingpowerInAllocationAfterVotes = await xAllocationVoting.getDepositVotingPower(
        voter.address,
        roundSnapshotAfterVotes,
      )
      const depositvotingpowerInGovernorAfter = await governor.getDepositVotingPower(
        voter.address,
        roundSnapshotAfterVotes,
      )

      console.log(
        "User total voting power (voting power + deposit voting power)",
        Number(votingPowerForAllocationAfterVotes) +
          Number(depositvotingpowerInAllocationAfterVotes) / 10 ** Number(await vot3.decimals()),
      )

      //Both deposit voting power should be 0 because no deposit was done
      expect(depositvotingpowerInAllocationBeforeVotes).to.equal(0)
      expect(depositvotingpowerInGovernorBeforeVotes).to.equal(0)
      expect(depositvotingpowerInAllocationBeforeVotes).to.equal(depositvotingpowerInGovernorBeforeVotes)

      //Both deposit voting power should be equal the threshold and same for the governor
      expect(depositvotingpowerInAllocationAfterVotes).to.equal(depositThreshold)
      expect(depositvotingpowerInGovernorAfter).to.equal(depositThreshold)
      expect(depositvotingpowerInAllocationAfterVotes).to.equal(depositvotingpowerInGovernorAfter)
    })
  })

  describe("Proposal deposit", function () {
    it("Deposit on proposal should be counted as voting power", async function () {})
    it("Withdrawal on proposal should be removed from voting power", async function () {})

    it("Should only count deposit voting power for the allocation voting and not for the proposal voting", async function () {})

    it("Should be able to deposit multiple times, incresing the voting power", async function () {})
    it("I can deposit twice in the same proposal, and have the sum of the deposits as Voting power", async function () {})

    it("Should be able to withdraw multiple times, decreasing the voting power", async function () {})

    it(
      "I can withdraw from a proposal, and the deposits voting power is either reduced or removeds to vote on allocation",
    )
  })
})
// const expectedVot3BalanceAfterDeposit = expectedVot3Balance //Balance should be the same as the beginning since we spent the deposit amount
// expect(await vot3.balanceOf(voter.address)).to.equal(expectedVot3BalanceAfterDeposit)

// const roundSnapshotBeforeVotes = await xAllocationVoting.roundSnapshot(roundIdBeforeVotesDeposit)
// //Wait the round to ends
// const deadline = await xAllocationVoting.roundDeadline(roundIdBeforeVotesDeposit)

// const currentBlock = await xAllocationVoting.clock()

// await moveBlocks(parseInt((deadline - currentBlock + BigInt(1)).toString()))
// await waitForNextBlock()
// await waitForNextBlock()
// console.log("working still")
// await xAllocationVoting.startNewRound()
// await emissions.distribute()

// const roundIdAfterVotesDeposit = await xAllocationVoting.currentRoundId()
// const roundSnapshotAfterVotes = await xAllocationVoting.roundSnapshot(roundIdAfterVotesDeposit)

// console.log("roundSnapshotBeforeVotes", roundSnapshotBeforeVotes)
// console.log("roundSnapshotAfterVotes", roundSnapshotAfterVotes)

// // check the voting power
// const roundSnapshot = await xAllocationVoting.roundSnapshot(roundIdAfterVotesDeposit)
// const votingPowerForAllocation = await xAllocationVoting.getVotes(voter.address, roundSnapshot)
// expect(votingPowerForAllocation).to.equal(ethers.parseEther("10100"))

// const votingPowerForProposal = await governor.getVotes(voter.address, roundIdAfterVotesDeposit)
// expect(votingPowerForProposal).to.equal(ethers.parseEther("100")) // only the deposit voting power is counted for the proposal
