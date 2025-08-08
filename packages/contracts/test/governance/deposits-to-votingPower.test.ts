import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { setupGovernanceFixtureWithEmissions, setupProposer, setupVoter, STANDARD_PROPOSAL_TYPE } from "./fixture.test"
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
  moveBlocks,
  startNewAllocationRound,
  getProposalIdFromTx,
  getVot3Tokens,
  waitForCurrentRoundToEnd,
  waitForNextBlock,
} from "../helpers/common"
import { endorseApp } from "../helpers/xnodes"
import { describe, it, beforeEach } from "mocha"
import { expect } from "chai"
import { catchRevert } from "../helpers"

describe("Voting power with proposal deposit", function () {
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
  let endorser1: SignerWithAddress
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
    endorser1 = fixture.otherAccounts[5]

    // Setup proposer for all tests
    await setupProposer(proposer, b3tr, vot3, minterAccount)
  })

  describe("Backward compatibility", function () {
    it("Should be able to vote in xApps allocation without proposal deposit if no deposit is done", async function () {
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

    it("Should be able to vote on allocation with the proposal deposit", async function () {
      //Submit the app
      await x2EarnApps
        .connect(owner)
        .submitApp(creator[0].address, creator[0].address, creator[0].address, "metadataURI")

      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(creator[0].address))
      //Endorse App
      await endorseApp(app1Id, endorser1)
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

      //Both deposit voting power should be 0 because no deposit was done
      expect(depositvotingpowerInAllocationBeforeVotes).to.equal(0)
      expect(depositvotingpowerInGovernorBeforeVotes).to.equal(0)
      expect(depositvotingpowerInAllocationBeforeVotes).to.equal(depositvotingpowerInGovernorBeforeVotes)

      //Both deposit voting power should be equal the threshold and same for the governor
      expect(depositvotingpowerInAllocationAfterVotes).to.equal(depositThreshold)
      expect(depositvotingpowerInGovernorAfter).to.equal(depositThreshold)
      expect(depositvotingpowerInAllocationAfterVotes).to.equal(depositvotingpowerInGovernorAfter)

      //Sum of the voting power and the deposit voting power to get the total vote available for the voter to vote on the allocation
      const totalVoteWithDeposit = votingPowerForAllocationAfterVotes + depositvotingpowerInAllocationAfterVotes

      const txForVote = await xAllocationVoting
        .connect(voter)
        .castVote(roundIdAfterVotesDeposit, [app1Id], [totalVoteWithDeposit])

      await txForVote.wait()

      const appVotes = await xAllocationVoting.getAppVotes(roundIdAfterVotesDeposit, app1Id)

      //The app should have the total vote with the deposit as voting power as well
      expect(totalVoteWithDeposit).to.equal(appVotes)
    })
    it("Should be able to vote on allocation with the proposal deposit if deposit twice", async function () {
      //Submit the app
      await x2EarnApps
        .connect(owner)
        .submitApp(creator[0].address, creator[0].address, creator[0].address, "metadataURI")

      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(creator[0].address))
      //Endorse App
      await endorseApp(app1Id, endorser1)
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

      //Deposit into the proposal the exact threshold in 2 operations
      await tx.wait()
      const proposalId = await getProposalIdFromTx(tx, false, { governor })

      const txForDeposit = await governor.connect(voter).deposit(depositThreshold / 2n, proposalId)
      await txForDeposit.wait()

      //Wait few blocks to simulate the time between the 2 deposits
      await moveBlocks(10)

      const txForDeposit2 = await governor.connect(voter).deposit(depositThreshold / 2n, proposalId)
      await txForDeposit2.wait()

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

      //Both deposit voting power should be 0 because no deposit was done
      expect(depositvotingpowerInAllocationBeforeVotes).to.equal(0)
      expect(depositvotingpowerInGovernorBeforeVotes).to.equal(0)
      expect(depositvotingpowerInAllocationBeforeVotes).to.equal(depositvotingpowerInGovernorBeforeVotes)

      //Both deposit voting power should be equal the threshold and same for the governor
      expect(depositvotingpowerInAllocationAfterVotes).to.equal(depositThreshold)
      expect(depositvotingpowerInGovernorAfter).to.equal(depositThreshold)
      expect(depositvotingpowerInAllocationAfterVotes).to.equal(depositvotingpowerInGovernorAfter)

      //Sum of the voting power and the deposit voting power to get the total vote available for the voter to vote on the allocation
      const totalVoteWithDeposit = votingPowerForAllocationAfterVotes + depositvotingpowerInAllocationAfterVotes

      const txForVote = await xAllocationVoting
        .connect(voter)
        .castVote(roundIdAfterVotesDeposit, [app1Id], [totalVoteWithDeposit])

      await txForVote.wait()

      const appVotes = await xAllocationVoting.getAppVotes(roundIdAfterVotesDeposit, app1Id)

      //The app should have the total vote with the deposit as voting power as well
      expect(totalVoteWithDeposit).to.equal(appVotes)
    })
    it("Should be able to vote on allocation with the proposal deposit if the proposal is created already with a deposit", async function () {
      //Submit the app
      await x2EarnApps
        .connect(owner)
        .submitApp(creator[0].address, creator[0].address, creator[0].address, "metadataURI")

      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(creator[0].address))
      //Endorse App
      await endorseApp(app1Id, endorser1)
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

      // Create the proposal already supporting the deposit threshold
      const tx = await governor
        .connect(voter)
        .propose(
          [await b3tr.getAddress()],
          [0],
          [(await ethers.getContractFactory("B3TR")).interface.encodeFunctionData("tokenDetails", [])],
          `${this?.test?.title}`,
          (Number(roundIdBeforeVotesDeposit) + 2).toString(),
          depositThreshold,
          {
            gasLimit: 10_000_000,
          },
        )

      await tx.wait()

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

      //Both deposit voting power should be 0 because no deposit was done
      expect(depositvotingpowerInAllocationBeforeVotes).to.equal(0)
      expect(depositvotingpowerInGovernorBeforeVotes).to.equal(0)
      expect(depositvotingpowerInAllocationBeforeVotes).to.equal(depositvotingpowerInGovernorBeforeVotes)

      //Both deposit voting power should be equal the threshold and same for the governor
      expect(depositvotingpowerInAllocationAfterVotes).to.equal(depositThreshold)
      expect(depositvotingpowerInGovernorAfter).to.equal(depositThreshold)
      expect(depositvotingpowerInAllocationAfterVotes).to.equal(depositvotingpowerInGovernorAfter)

      //Sum of the voting power and the deposit voting power to get the total vote available for the voter to vote on the allocation
      const totalVoteWithDeposit = votingPowerForAllocationAfterVotes + depositvotingpowerInAllocationAfterVotes

      const txForVote = await xAllocationVoting
        .connect(voter)
        .castVote(roundIdAfterVotesDeposit, [app1Id], [totalVoteWithDeposit])

      await txForVote.wait()

      const appVotes = await xAllocationVoting.getAppVotes(roundIdAfterVotesDeposit, app1Id)

      //The app should have the total vote with the deposit as voting power as well
      expect(totalVoteWithDeposit).to.equal(appVotes)
    })

    it("Should NOT be able to vote on allocation with the proposal deposit if the value is higher than the total voting power", async function () {
      //Submit the app
      await x2EarnApps
        .connect(owner)
        .submitApp(creator[0].address, creator[0].address, creator[0].address, "metadataURI")

      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(creator[0].address))
      //Endorse App
      await endorseApp(app1Id, endorser1)
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

      // Create the proposal already supporting the deposit threshold
      const tx = await governor
        .connect(voter)
        .propose(
          [await b3tr.getAddress()],
          [0],
          [(await ethers.getContractFactory("B3TR")).interface.encodeFunctionData("tokenDetails", [])],
          `${this?.test?.title}`,
          (Number(roundIdBeforeVotesDeposit) + 2).toString(),
          depositThreshold,
          {
            gasLimit: 10_000_000,
          },
        )

      await tx.wait()

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

      //Both deposit voting power should be 0 because no deposit was done
      expect(depositvotingpowerInAllocationBeforeVotes).to.equal(0)
      expect(depositvotingpowerInGovernorBeforeVotes).to.equal(0)
      expect(depositvotingpowerInAllocationBeforeVotes).to.equal(depositvotingpowerInGovernorBeforeVotes)

      //Both deposit voting power should be equal the threshold and same for the governor
      expect(depositvotingpowerInAllocationAfterVotes).to.equal(depositThreshold)
      expect(depositvotingpowerInGovernorAfter).to.equal(depositThreshold)
      expect(depositvotingpowerInAllocationAfterVotes).to.equal(depositvotingpowerInGovernorAfter)

      //Sum of the voting power and the deposit voting power to get the total vote available for the voter to vote on the allocation
      const totalVoteWithDeposit = votingPowerForAllocationAfterVotes + depositvotingpowerInAllocationAfterVotes

      await catchRevert(
        xAllocationVoting.connect(voter).castVote(roundIdAfterVotesDeposit, [app1Id], [totalVoteWithDeposit + 1n]),
      )

      const appVotes = await xAllocationVoting.getAppVotes(roundIdAfterVotesDeposit, app1Id)

      //App should not have any votes because the total vote with the deposit is higher than the total voting power and tx reverted
      expect(appVotes).to.equal(0)
    })

    it("Should be able to vote on allocation even if no deposit was done", async function () {
      //Submit the app
      await x2EarnApps
        .connect(owner)
        .submitApp(creator[0].address, creator[0].address, creator[0].address, "metadataURI")

      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(creator[0].address))
      //Endorse App
      await endorseApp(app1Id, endorser1)
      //Setup voter + start new round
      await setupVoter(voter, b3tr, vot3, minterAccount, owner, veBetterPassport)

      const expectedVot3Balance = ethers.parseEther("10000")
      expect(await vot3.balanceOf(voter.address)).to.equal(expectedVot3Balance)

      //Start emissions
      await emissions.connect(minterAccount).start()

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

      const currentRoundId = await xAllocationVoting.currentRoundId()
      const currentRoundSnapshot = await xAllocationVoting.roundSnapshot(currentRoundId)

      const votingPowerForAllocationAfterVotes = await xAllocationVoting.getVotes(voter.address, currentRoundSnapshot)
      const depositVotingPower = await xAllocationVoting.getDepositVotingPower(voter.address, currentRoundSnapshot)

      expect(votingPowerForAllocationAfterVotes).to.equal(expectedVot3Balance)
      expect(depositVotingPower).to.equal(0)

      const txForVote = await xAllocationVoting
        .connect(voter)
        .castVote(currentRoundId, [app1Id], [votingPowerForAllocationAfterVotes])

      await txForVote.wait()

      const appVotes = await xAllocationVoting.getAppVotes(currentRoundId, app1Id)

      //The app should have the total vote with the deposit as voting power as well
      expect(votingPowerForAllocationAfterVotes).to.equal(appVotes)
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
