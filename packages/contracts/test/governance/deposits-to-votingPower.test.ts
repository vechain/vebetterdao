import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { setupGovernanceFixtureWithEmissions, setupProposer, setupVoter } from "./fixture.test"
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
import { getRoundId, moveBlocks, startNewAllocationRound, getProposalIdFromTx } from "../helpers/common"
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

    it.only("Should be able to vote on proposal with the proposal VP", async function () {
      // submit app
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(creator[0].address))

      await x2EarnApps
        .connect(owner)
        .submitApp(creator[0].address, creator[0].address, creator[0].address, "metadataURI")

      const roundid = await getRoundId({ emissions, xAllocationVoting })

      // Now we can create a new proposal
      const address = await b3tr.getAddress()
      const B3trContract = await ethers.getContractFactory("B3TR")
      const encodedFunctionCall = B3trContract.interface.encodeFunctionData("tokenDetails", [])
      const voteStartsInRoundId = (await xAllocationVoting.currentRoundId()) + 1n // starts in next round

      console.log("voteStartsInRoundId", voteStartsInRoundId)
      // Create a proposal with a deposit of 1000 VOT3
      // WIP HERE IS BLOCKING WITH ALLOWANCE
      const tx = await governor
        .connect(owner)
        .propose([address], [0], [encodedFunctionCall], "", voteStartsInRoundId.toString(), ethers.parseEther("1000"), {
          gasLimit: 10_000_000,
        })

      // next round i got the deposit voting power
      const proposalId = await getProposalIdFromTx(tx)

      // check the voting power
      const roundSnapshot = await xAllocationVoting.roundSnapshot(roundid)
      const votingPowerForAllocation = await xAllocationVoting.getVotes(voter.address, roundSnapshot)
      expect(votingPowerForAllocation).to.equal(ethers.parseEther("10100"))

      const votingPowerForProposal = await governor.getVotes(voter.address, roundid)
      expect(votingPowerForProposal).to.equal(ethers.parseEther("100")) // only the deposit voting power is counted for the proposal
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
