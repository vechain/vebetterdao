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
 * Final V11 surface:
 *   - propose(...args, maxBudget)      — single 7-arg signature
 *   - markAsInDevelopment(id, payee, description, implementationDiscussion, contributors[])
 *   - updateCommunityExecution(...)    — proposer or admin can edit until claimPayout()
 *   - claimPayout(id)                  — anyone; pays full budget to the single registered payee
 *
 * One payout address per proposal; that wallet is then responsible for forwarding funds to
 * any contributors / dev team off-chain. Contributors are stored as a string[] of handles.
 */
describe("Governance - Community Execution Framework V11 - @shard4z", function () {
  let governor: B3TRGovernor
  let vot3: VOT3
  let b3tr: B3TR
  let treasury: Treasury
  let owner: SignerWithAddress
  let proposer: SignerWithAddress
  let otherAccounts: SignerWithAddress[]
  let veBetterPassport: VeBetterPassport
  let emissions: Emissions
  let xAllocationVoting: XAllocationVoting
  let minterAccount: SignerWithAddress
  // unused but destructured in the fixture
  let _voter: SignerWithAddress
  let _b3trContract: ContractFactory

  const E = (n: string | number) => ethers.parseEther(n.toString())

  beforeEach(async function () {
    const fixture = await setupGovernanceFixtureWithEmissions()
    governor = fixture.governor
    vot3 = fixture.vot3
    b3tr = fixture.b3tr
    treasury = fixture.treasury
    owner = fixture.owner
    proposer = fixture.proposer
    _voter = fixture.voter
    otherAccounts = fixture.otherAccounts
    veBetterPassport = fixture.veBetterPassport
    emissions = fixture.emissions
    xAllocationVoting = fixture.xAllocationVoting
    minterAccount = fixture.minterAccount
    _b3trContract = fixture.b3trContract

    await setupProposer(proposer, b3tr, vot3, minterAccount)
  })

  /// Helper: text-only Standard proposal voted through to `Succeeded`. Optional budget.
  async function createAndPassTextProposal(opts: { budget?: bigint; description?: string } = {}) {
    const targets: string[] = []
    const values: bigint[] = []
    const calldatas: string[] = []
    const description = opts.description ?? `desc-${Math.random().toString(36).slice(2, 10)}`
    const startRoundId = (await getRoundId()) + 1

    const tx = await governor
      .connect(proposer)
      .propose(targets, values, calldatas, description, startRoundId, 0, opts.budget ?? 0)

    const proposalId = await getProposalIdFromTx(tx)

    const proposalDepositThreshold = await governor.proposalDepositThreshold(proposalId)
    await setupSupporter(proposer, vot3, proposalDepositThreshold, governor)
    await governor.connect(proposer).deposit(proposalDepositThreshold, proposalId)

    await waitForCurrentRoundToEnd()

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

  describe("propose budget", () => {
    it("records maxBudget > 0 on chain and emits ProposalBudgetSet", async () => {
      const budget = E(1000)
      const targets: string[] = []
      const values: bigint[] = []
      const calldatas: string[] = []
      const description = `budget-set-${Date.now()}`
      const startRoundId = (await getRoundId()) + 1

      await expect(
        governor.connect(proposer).propose(targets, values, calldatas, description, startRoundId, 0, budget),
      ).to.emit(governor, "ProposalBudgetSet")

      const proposalId = await governor.hashProposal(
        targets,
        values,
        calldatas,
        ethers.keccak256(ethers.toUtf8Bytes(description)),
      )
      expect(await governor.getProposalBudget(proposalId)).to.equal(budget)
    })

    it("propose with maxBudget == 0 records no budget", async () => {
      const targets: string[] = []
      const values: bigint[] = []
      const calldatas: string[] = []
      const description = `legacy-${Date.now()}`
      const startRoundId = (await getRoundId()) + 1
      const tx = await governor.connect(proposer).propose(targets, values, calldatas, description, startRoundId, 0, 0)
      const proposalId = await getProposalIdFromTx(tx)
      expect(await governor.getProposalBudget(proposalId)).to.equal(0n)
    })
  })

  // ------------------- markAsInDevelopment ------------------- //

  describe("markAsInDevelopment", () => {
    it("proposer can register a single payee and transition to InDevelopment", async () => {
      const budget = E(1000)
      const proposalId = await createAndPassTextProposal({ budget })

      const payee = otherAccounts[5].address
      const contributors = ["github:alice", "twitter:@bob"]

      await expect(
        governor
          .connect(proposer)
          .markAsInDevelopment(
            proposalId,
            payee,
            "Developed by Alice & Bob",
            "https://forum.example/123",
            contributors,
          ),
      )
        .to.emit(governor, "ProposalInDevelopment")
        .and.to.emit(governor, "ProposalInDevelopmentDetails")
        .and.to.emit(governor, "ProposalContributorsSet")

      expect(await governor.state(proposalId)).to.equal(8) // InDevelopment
      expect(await governor.getProposalPayee(proposalId)).to.equal(payee)
      expect(await governor.getProposalDescription(proposalId)).to.equal("Developed by Alice & Bob")
      expect(await governor.getProposalImplementationDiscussion(proposalId)).to.equal("https://forum.example/123")
      expect(await governor.getProposalContributors(proposalId)).to.deep.equal(contributors)
      expect(await governor.isProposalPaid(proposalId)).to.equal(false)
    })

    it("PROPOSAL_STATE_MANAGER_ROLE admin can register on behalf of the proposer", async () => {
      const proposalId = await createAndPassTextProposal({ budget: E(500) })
      await expect(
        governor
          .connect(owner)
          .markAsInDevelopment(proposalId, otherAccounts[5].address, "desc", "https://x.example", []),
      ).to.not.be.reverted
      expect(await governor.state(proposalId)).to.equal(8)
    })

    it("an unrelated account cannot register", async () => {
      const proposalId = await createAndPassTextProposal({ budget: E(100) })
      await expect(
        governor.connect(otherAccounts[7]).markAsInDevelopment(proposalId, otherAccounts[5].address, "n", "l", []),
      ).to.be.revertedWithCustomError(governor, "UnauthorizedCommunityExecution")
    })

    it("reverts when budget > 0 and payee is the zero address", async () => {
      const proposalId = await createAndPassTextProposal({ budget: E(100) })
      await expect(
        governor.connect(proposer).markAsInDevelopment(proposalId, ethers.ZeroAddress, "n", "l", []),
      ).to.be.revertedWithCustomError(governor, "InvalidPayeeAddress")
    })

    it("reverts when budget == 0 but a payee is provided", async () => {
      const proposalId = await createAndPassTextProposal({})
      await expect(
        governor.connect(proposer).markAsInDevelopment(proposalId, otherAccounts[5].address, "n", "l", []),
      ).to.be.revertedWithCustomError(governor, "MissingProposalBudget")
    })

    it("allows budget == 0 with zero payee (pure state transition, no payout flow)", async () => {
      const proposalId = await createAndPassTextProposal({})
      await expect(
        governor.connect(proposer).markAsInDevelopment(proposalId, ethers.ZeroAddress, "desc", "https://x", []),
      ).to.emit(governor, "ProposalInDevelopment")
      expect(await governor.state(proposalId)).to.equal(8)
      expect(await governor.getProposalPayee(proposalId)).to.equal(ethers.ZeroAddress)
    })

    it("calling twice reverts (state already InDevelopment)", async () => {
      const proposalId = await createAndPassTextProposal({ budget: E(100) })
      await governor.connect(proposer).markAsInDevelopment(proposalId, otherAccounts[5].address, "n", "l", [])
      await expect(
        governor.connect(proposer).markAsInDevelopment(proposalId, otherAccounts[5].address, "n", "l", []),
      ).to.be.revertedWithCustomError(governor, "GovernorUnexpectedProposalState")
    })

    it("reverts when too many contributors are passed", async () => {
      const proposalId = await createAndPassTextProposal({ budget: E(100) })
      const contributors = Array.from({ length: 21 }, (_, i) => `gh:user${i}`)
      await expect(
        governor.connect(proposer).markAsInDevelopment(proposalId, otherAccounts[5].address, "n", "l", contributors),
      ).to.be.revertedWithCustomError(governor, "TooManyContributors")
    })
  })

  // ------------------- updateCommunityExecution ------------------- //

  describe("updateCommunityExecution", () => {
    it("proposer can update the payee + metadata until the payout is claimed", async () => {
      const proposalId = await createAndPassTextProposal({ budget: E(500) })
      await governor
        .connect(proposer)
        .markAsInDevelopment(proposalId, otherAccounts[5].address, "v1 desc", "https://v1", ["gh:a"])

      const newPayee = otherAccounts[6].address
      await expect(
        governor
          .connect(proposer)
          .updateCommunityExecution(proposalId, newPayee, "v2 desc", "https://v2", ["gh:c", "gh:d"]),
      )
        .to.emit(governor, "ProposalInDevelopmentDetails")
        .and.to.emit(governor, "ProposalContributorsSet")

      expect(await governor.getProposalPayee(proposalId)).to.equal(newPayee)
      expect(await governor.getProposalDescription(proposalId)).to.equal("v2 desc")
      expect(await governor.getProposalContributors(proposalId)).to.deep.equal(["gh:c", "gh:d"])
    })

    it("admin can update even when caller is not the proposer", async () => {
      const proposalId = await createAndPassTextProposal({ budget: E(500) })
      await governor.connect(proposer).markAsInDevelopment(proposalId, otherAccounts[5].address, "v1", "https://v1", [])

      await expect(
        governor
          .connect(owner)
          .updateCommunityExecution(proposalId, otherAccounts[6].address, "admin", "https://admin", []),
      ).to.not.be.reverted
      expect(await governor.getProposalPayee(proposalId)).to.equal(otherAccounts[6].address)
    })

    it("unauthorized caller is rejected", async () => {
      const proposalId = await createAndPassTextProposal({ budget: E(500) })
      await governor.connect(proposer).markAsInDevelopment(proposalId, otherAccounts[5].address, "v1", "https://v1", [])

      await expect(
        governor.connect(otherAccounts[7]).updateCommunityExecution(proposalId, otherAccounts[6].address, "n", "l", []),
      ).to.be.revertedWithCustomError(governor, "UnauthorizedCommunityExecution")
    })

    it("reverts after the payout has been claimed", async () => {
      const budget = E(100)
      const proposalId = await createAndPassTextProposal({ budget })
      await governor.connect(proposer).markAsInDevelopment(proposalId, otherAccounts[5].address, "v1", "https://v1", [])
      await governor.connect(owner).markAsCompleted(proposalId)
      await b3tr.connect(minterAccount).mint(await treasury.getAddress(), budget)
      await governor.connect(otherAccounts[8]).claimPayout(proposalId)

      await expect(
        governor
          .connect(proposer)
          .updateCommunityExecution(proposalId, otherAccounts[6].address, "v2", "https://v2", []),
      ).to.be.revertedWithCustomError(governor, "PayoutAlreadyClaimed")
    })
  })

  // ------------------- claimPayout ------------------- //

  describe("claimPayout", () => {
    it("anyone can trigger the payout; the full budget goes to the registered payee; idempotent", async () => {
      const budget = E(900)
      const proposalId = await createAndPassTextProposal({ budget })
      const payee = otherAccounts[5].address
      await governor.connect(proposer).markAsInDevelopment(proposalId, payee, "desc", "https://x", ["gh:a", "gh:b"])
      await governor.connect(owner).markAsCompleted(proposalId)

      await b3tr.connect(minterAccount).mint(await treasury.getAddress(), budget)
      const before = await b3tr.balanceOf(payee)

      await expect(governor.connect(otherAccounts[8]).claimPayout(proposalId)).to.emit(
        governor,
        "ProposalPayoutClaimed",
      )

      expect(await b3tr.balanceOf(payee)).to.equal(before + budget)
      expect(await governor.isProposalPaid(proposalId)).to.equal(true)

      await expect(governor.connect(otherAccounts[8]).claimPayout(proposalId)).to.be.revertedWithCustomError(
        governor,
        "PayoutAlreadyClaimed",
      )
    })

    it("claim reverts before the proposal is Completed", async () => {
      const proposalId = await createAndPassTextProposal({ budget: E(100) })
      await governor.connect(proposer).markAsInDevelopment(proposalId, otherAccounts[5].address, "n", "l", [])
      await b3tr.connect(minterAccount).mint(await treasury.getAddress(), E(100))
      await expect(governor.connect(owner).claimPayout(proposalId)).to.be.revertedWithCustomError(
        governor,
        "GovernorUnexpectedProposalState",
      )
    })

    it("claim reverts when the proposal has no budget / no payee", async () => {
      const proposalId = await createAndPassTextProposal({})
      await governor.connect(proposer).markAsInDevelopment(proposalId, ethers.ZeroAddress, "desc", "https://x", [])
      await governor.connect(owner).markAsCompleted(proposalId)
      await expect(governor.connect(owner).claimPayout(proposalId)).to.be.revertedWithCustomError(
        governor,
        "NotReadyToClaim",
      )
    })
  })

  // ------------------- misc ------------------- //

  describe("misc", () => {
    it("version() reports 11", async () => {
      expect(await governor.version()).to.equal("11")
    })
  })
})
