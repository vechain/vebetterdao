import { describe, it, beforeEach } from "mocha"
import { expect } from "chai"
import { ethers } from "hardhat"
import { ContractFactory } from "ethers"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"

import { setupProposer, setupSupporter, setupVoter, setupGovernanceFixtureWithEmissions } from "./fixture.test"
import {
  B3TRGovernor,
  VOT3,
  B3TR,
  Treasury,
  VeBetterPassport,
  Emissions,
  XAllocationVoting,
} from "../../typechain-types"
import {
  getProposalIdFromTx,
  getRoundId,
  startNewAllocationRound,
  waitForCurrentRoundToEnd,
  waitForProposalToBeActive,
  waitForVotingPeriodToEnd,
} from "../helpers/common"

/**
 * V11 Community Execution Framework end-to-end coverage.
 *
 * Validates the new flow on top of the existing markAsInDevelopment /
 * markAsCompleted state machine: max budget at proposal creation,
 * payee registration via markAsInDevelopmentWithPayees (proposer OR admin),
 * admin-only updatePayees, anyone-can-call claimPayout / claimAllPayouts,
 * idempotency, budget cap, legacy backwards compatibility.
 */
describe("Governance - Community Execution Framework V11 - @shard4z", function () {
  let governor: B3TRGovernor
  let vot3: VOT3
  let b3tr: B3TR
  let treasury: Treasury
  let owner: SignerWithAddress
  let proposer: SignerWithAddress
  let voter: SignerWithAddress
  let otherAccounts: SignerWithAddress[]
  let veBetterPassport: VeBetterPassport
  let emissions: Emissions
  let xAllocationVoting: XAllocationVoting
  let minterAccount: SignerWithAddress
  let b3trContract: ContractFactory

  // shorthands
  const E = (n: string | number) => ethers.parseEther(n.toString())

  beforeEach(async function () {
    const fixture = await setupGovernanceFixtureWithEmissions()
    governor = fixture.governor
    vot3 = fixture.vot3
    b3tr = fixture.b3tr
    treasury = fixture.treasury
    owner = fixture.owner
    proposer = fixture.proposer
    voter = fixture.voter
    otherAccounts = fixture.otherAccounts
    veBetterPassport = fixture.veBetterPassport
    emissions = fixture.emissions
    xAllocationVoting = fixture.xAllocationVoting
    minterAccount = fixture.minterAccount
    b3trContract = fixture.b3trContract

    await setupProposer(proposer, b3tr, vot3, minterAccount)
  })

  /// Helper: create a text-only Standard proposal (no on-chain actions), vote it through
  /// to `Succeeded`. Optionally registers a max B3TR budget via the new propose(7) overload.
  async function createAndPassTextProposal(opts: { budget?: bigint; description?: string } = {}) {
    const targets: string[] = []
    const values: bigint[] = []
    const calldatas: string[] = []
    const description = opts.description ?? `desc-${Math.random().toString(36).slice(2, 10)}`
    const startRoundId = (await getRoundId()) + 1

    const tx = opts.budget
      ? await governor
          .connect(proposer)
          .proposeWithBudget(targets, values, calldatas, description, startRoundId, 0, opts.budget)
      : await governor.connect(proposer).propose(targets, values, calldatas, description, startRoundId, 0)

    const proposalId = await getProposalIdFromTx(tx)

    // Pay deposit so proposal can become active.
    const proposalDepositThreshold = await governor.proposalDepositThreshold(proposalId)
    await setupSupporter(proposer, vot3, proposalDepositThreshold, governor)
    await governor.connect(proposer).deposit(proposalDepositThreshold, proposalId)

    await waitForCurrentRoundToEnd()

    // Setup three voters with passport whitelist
    await setupVoter(otherAccounts[0], b3tr, vot3, minterAccount, owner, veBetterPassport)
    await setupVoter(otherAccounts[1], b3tr, vot3, minterAccount, owner, veBetterPassport)
    await setupVoter(otherAccounts[2], b3tr, vot3, minterAccount, owner, veBetterPassport)

    await startNewAllocationRound({ emissions, xAllocationVoting })
    await waitForProposalToBeActive(proposalId, { governor })

    await governor.connect(otherAccounts[0]).castVote(proposalId, 1)
    await governor.connect(otherAccounts[1]).castVote(proposalId, 1)
    await governor.connect(otherAccounts[2]).castVote(proposalId, 1)

    await waitForVotingPeriodToEnd(proposalId)

    return proposalId as bigint
  }

  // ------------------- propose(7) / budget storage ------------------- //

  describe("proposeWithBudget", () => {
    it("records the maxBudget on chain and emits ProposalBudgetSet", async () => {
      const budget = E(1000)
      const targets: string[] = []
      const values: bigint[] = []
      const calldatas: string[] = []
      const description = `budget-set-${Date.now()}`
      const startRoundId = (await getRoundId()) + 1

      await expect(
        governor.connect(proposer).proposeWithBudget(targets, values, calldatas, description, startRoundId, 0, budget),
      ).to.emit(governor, "ProposalBudgetSet")

      // proposalId is the hash regardless of which overload we used.
      const proposalId = await governor.hashProposal(
        targets,
        values,
        calldatas,
        ethers.keccak256(ethers.toUtf8Bytes(description)),
      )
      expect(await governor.getProposalBudget(proposalId)).to.equal(budget)
    })

    it("the legacy propose(6) records no budget", async () => {
      const targets: string[] = []
      const values: bigint[] = []
      const calldatas: string[] = []
      const description = `legacy-${Date.now()}`
      const startRoundId = (await getRoundId()) + 1
      const tx = await governor.connect(proposer).propose(targets, values, calldatas, description, startRoundId, 0)
      const proposalId = await getProposalIdFromTx(tx)
      expect(await governor.getProposalBudget(proposalId)).to.equal(0n)
    })
  })

  // ------------------- markAsInDevelopmentWithPayees ------------------- //

  describe("markAsInDevelopmentWithPayees", () => {
    it("proposer can register payees and transitions to InDevelopment", async () => {
      const budget = E(1000)
      const proposalId = await createAndPassTextProposal({ budget })

      const payees = [
        { account: otherAccounts[5].address, amount: E(600) },
        { account: otherAccounts[6].address, amount: E(400) },
      ]
      await expect(
        governor
          .connect(proposer)
          .markAsInDevelopmentWithPayees(proposalId, payees, "alice", "https://forum.example/123"),
      )
        .to.emit(governor, "ProposalInDevelopment")
        .and.to.emit(governor, "ProposalInDevelopmentDetails")

      expect(await governor.state(proposalId)).to.equal(8) // InDevelopment
      const stored = await governor.getProposalPayees(proposalId)
      expect(stored.length).to.equal(2)
      expect(stored[0].account).to.equal(otherAccounts[5].address)
      expect(stored[0].amount).to.equal(E(600))
      expect(stored[1].amount).to.equal(E(400))
      const [nickname, link] = await governor.getProposalDevInfo(proposalId)
      expect(nickname).to.equal("alice")
      expect(link).to.equal("https://forum.example/123")
    })

    it("PROPOSAL_STATE_MANAGER_ROLE admin can register on behalf of the proposer", async () => {
      const proposalId = await createAndPassTextProposal({ budget: E(500) })
      const payees = [{ account: otherAccounts[5].address, amount: E(500) }]
      await expect(
        governor.connect(owner).markAsInDevelopmentWithPayees(proposalId, payees, "bob", "https://x.example"),
      ).to.not.be.reverted
      expect(await governor.state(proposalId)).to.equal(8)
    })

    it("an unrelated account cannot register payees", async () => {
      const proposalId = await createAndPassTextProposal({ budget: E(100) })
      await expect(
        governor
          .connect(otherAccounts[7])
          .markAsInDevelopmentWithPayees(proposalId, [{ account: otherAccounts[5].address, amount: E(100) }], "n", "l"),
      ).to.be.revertedWithCustomError(governor, "UnauthorizedCommunityExecution")
    })

    it("reverts when no budget was registered for the proposal", async () => {
      // create via legacy propose(6) → no budget
      const proposalId = await createAndPassTextProposal({})
      await expect(
        governor
          .connect(proposer)
          .markAsInDevelopmentWithPayees(proposalId, [{ account: otherAccounts[5].address, amount: E(1) }], "n", "l"),
      ).to.be.revertedWithCustomError(governor, "MissingProposalBudget")
    })

    it("reverts when payee sum exceeds the budget", async () => {
      const proposalId = await createAndPassTextProposal({ budget: E(1000) })
      const payees = [
        { account: otherAccounts[5].address, amount: E(600) },
        { account: otherAccounts[6].address, amount: E(500) },
      ]
      await expect(
        governor.connect(proposer).markAsInDevelopmentWithPayees(proposalId, payees, "n", "l"),
      ).to.be.revertedWithCustomError(governor, "BudgetExceeded")
    })

    it("reverts on empty payees", async () => {
      const proposalId = await createAndPassTextProposal({ budget: E(100) })
      await expect(
        governor.connect(proposer).markAsInDevelopmentWithPayees(proposalId, [], "n", "l"),
      ).to.be.revertedWithCustomError(governor, "InvalidPayeeCount")
    })

    it("reverts on zero-address / zero-amount payee", async () => {
      const proposalId = await createAndPassTextProposal({ budget: E(100) })
      await expect(
        governor
          .connect(proposer)
          .markAsInDevelopmentWithPayees(proposalId, [{ account: ethers.ZeroAddress, amount: E(1) }], "n", "l"),
      ).to.be.revertedWithCustomError(governor, "InvalidPayee")
      await expect(
        governor
          .connect(proposer)
          .markAsInDevelopmentWithPayees(proposalId, [{ account: otherAccounts[5].address, amount: 0 }], "n", "l"),
      ).to.be.revertedWithCustomError(governor, "InvalidPayee")
    })

    it("calling twice reverts (state already InDevelopment)", async () => {
      const proposalId = await createAndPassTextProposal({ budget: E(100) })
      const payees = [{ account: otherAccounts[5].address, amount: E(100) }]
      await governor.connect(proposer).markAsInDevelopmentWithPayees(proposalId, payees, "n", "l")
      // After first call the state is InDevelopment which is NOT in {Succeeded, Executed},
      // so validateStateBitmap reverts before reaching the PayeesAlreadyFinalized guard.
      await expect(
        governor.connect(proposer).markAsInDevelopmentWithPayees(proposalId, payees, "n", "l"),
      ).to.be.revertedWithCustomError(governor, "GovernorUnexpectedProposalState")
    })
  })

  // ------------------- updatePayees ------------------- //

  describe("updatePayees", () => {
    it("admin can replace payees when no claim has happened", async () => {
      const proposalId = await createAndPassTextProposal({ budget: E(1000) })
      await governor
        .connect(proposer)
        .markAsInDevelopmentWithPayees(proposalId, [{ account: otherAccounts[5].address, amount: E(500) }], "n", "l")

      const newPayees = [
        { account: otherAccounts[6].address, amount: E(400) },
        { account: otherAccounts[7].address, amount: E(300) },
      ]
      await expect(governor.connect(owner).updatePayees(proposalId, newPayees)).to.emit(governor, "ProposalPayeesReset")
      const stored = await governor.getProposalPayees(proposalId)
      expect(stored.length).to.equal(2)
      expect(stored[0].account).to.equal(otherAccounts[6].address)
      expect(stored[1].account).to.equal(otherAccounts[7].address)
    })

    it("non-admin cannot call updatePayees", async () => {
      const proposalId = await createAndPassTextProposal({ budget: E(100) })
      await governor
        .connect(proposer)
        .markAsInDevelopmentWithPayees(proposalId, [{ account: otherAccounts[5].address, amount: E(100) }], "n", "l")
      await expect(
        governor.connect(proposer).updatePayees(proposalId, [{ account: otherAccounts[6].address, amount: E(100) }]),
      ).to.be.reverted
    })
  })

  // ------------------- claim payouts ------------------- //

  describe("claimPayout / claimAllPayouts", () => {
    it("anyone can claim a single payout; idempotent at the (proposalId, index) granularity", async () => {
      const budget = E(900)
      const proposalId = await createAndPassTextProposal({ budget })
      const payees = [
        { account: otherAccounts[5].address, amount: E(300) },
        { account: otherAccounts[6].address, amount: E(600) },
      ]
      await governor.connect(proposer).markAsInDevelopmentWithPayees(proposalId, payees, "n", "l")
      await governor.connect(owner).markAsCompleted(proposalId)

      // Fund Treasury so transfers can succeed.
      await b3tr.connect(minterAccount).mint(await treasury.getAddress(), budget)
      const before5 = await b3tr.balanceOf(otherAccounts[5].address)
      const before6 = await b3tr.balanceOf(otherAccounts[6].address)

      // Call from a random third party.
      await expect(governor.connect(otherAccounts[8]).claimPayout(proposalId, 0)).to.emit(
        governor,
        "ProposalPayoutClaimed",
      )

      expect(await b3tr.balanceOf(otherAccounts[5].address)).to.equal(before5 + E(300))
      expect(await governor.isPayoutClaimed(proposalId, 0)).to.equal(true)
      expect(await governor.isPayoutClaimed(proposalId, 1)).to.equal(false)

      // Double-claim same index reverts.
      await expect(governor.connect(otherAccounts[8]).claimPayout(proposalId, 0)).to.be.revertedWithCustomError(
        governor,
        "PayoutAlreadyClaimed",
      )

      // Other index is still claimable.
      await governor.connect(otherAccounts[5]).claimPayout(proposalId, 1)
      expect(await b3tr.balanceOf(otherAccounts[6].address)).to.equal(before6 + E(600))
    })

    it("claim reverts before the proposal is Completed", async () => {
      const proposalId = await createAndPassTextProposal({ budget: E(100) })
      await governor
        .connect(proposer)
        .markAsInDevelopmentWithPayees(proposalId, [{ account: otherAccounts[5].address, amount: E(100) }], "n", "l")
      // not yet marked Completed
      await b3tr.connect(minterAccount).mint(await treasury.getAddress(), E(100))
      await expect(governor.connect(owner).claimPayout(proposalId, 0)).to.be.revertedWithCustomError(
        governor,
        "GovernorUnexpectedProposalState",
      )
    })

    it("claimAllPayouts pays every payee and skips already-claimed entries", async () => {
      const budget = E(1000)
      const proposalId = await createAndPassTextProposal({ budget })
      const payees = [
        { account: otherAccounts[5].address, amount: E(400) },
        { account: otherAccounts[6].address, amount: E(600) },
      ]
      await governor.connect(proposer).markAsInDevelopmentWithPayees(proposalId, payees, "n", "l")
      await governor.connect(owner).markAsCompleted(proposalId)
      await b3tr.connect(minterAccount).mint(await treasury.getAddress(), budget)

      // pre-claim index 0
      await governor.connect(otherAccounts[8]).claimPayout(proposalId, 0)
      const balBefore5 = await b3tr.balanceOf(otherAccounts[5].address)
      const balBefore6 = await b3tr.balanceOf(otherAccounts[6].address)

      // claimAllPayouts pays index 1 only (0 is skipped)
      await governor.connect(otherAccounts[9]).claimAllPayouts(proposalId)
      expect(await b3tr.balanceOf(otherAccounts[5].address)).to.equal(balBefore5)
      expect(await b3tr.balanceOf(otherAccounts[6].address)).to.equal(balBefore6 + E(600))

      // running again reverts (nothing left to claim)
      await expect(governor.connect(otherAccounts[9]).claimAllPayouts(proposalId)).to.be.revertedWithCustomError(
        governor,
        "NothingToClaim",
      )
    })
  })

  // ------------------- backwards compatibility ------------------- //

  describe("backwards compatibility", () => {
    it("legacy markAsInDevelopment(uint256) still works for budget==0 proposals", async () => {
      const proposalId = await createAndPassTextProposal({})
      await governor.connect(owner).markAsInDevelopment(proposalId)
      expect(await governor.state(proposalId)).to.equal(8)
      // payees array is empty so no payout flow available
      const stored = await governor.getProposalPayees(proposalId)
      expect(stored.length).to.equal(0)
    })

    it("version() reports 11", async () => {
      expect(await governor.version()).to.equal("11")
    })

    it("treasury() / maxPayeesPerProposal are accessible via the new initialized storage", async () => {
      // No public getter for these in V11 to save contract size — verify via behavior:
      // a claim path requires treasury to be set + budget validations require cap > 0.
      // markAsInDevelopmentWithPayees with valid sum but oversize array would revert InvalidPayeeCount.
      const proposalId = await createAndPassTextProposal({ budget: E(21) })
      const payees = Array.from({ length: 21 }, (_, i) => ({
        account: otherAccounts[i % otherAccounts.length].address,
        amount: E(1),
      }))
      await expect(
        governor.connect(proposer).markAsInDevelopmentWithPayees(proposalId, payees, "n", "l"),
      ).to.be.revertedWithCustomError(governor, "InvalidPayeeCount")
    })
  })
})
