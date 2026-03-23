import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { expect } from "chai"
import { ethers } from "hardhat"
import { describe, it } from "mocha"

import {
  bootstrapAndStartEmissions,
  getOrDeployContractInstances,
  getVot3Tokens,
  waitForProposalToBeActive,
} from "../helpers"

describe("Governance - V10 Upgrade - @shard4g", function () {
  it("Should upgrade from V9 to V10 preserving proposals, votes, and roles", async () => {
    const config = createLocalConfig()
    const {
      governor,
      owner,
      otherAccounts,
      vot3,
      b3tr,
      voterRewards,
      xAllocationVoting,
      veBetterPassport,
      governorClockLogicLib,
      governorConfiguratorLib,
      governorDepositLogicLib,
      governorFunctionRestrictionsLogicLib,
      governorProposalLogicLib,
      governorQuorumLogicLib,
      governorStateLogicLib,
      governorVotesLogicLib,
    } = await getOrDeployContractInstances({ forceDeploy: true, config })

    // --- Setup: bootstrap emissions and get tokens ---
    await bootstrapAndStartEmissions()

    const proposer = otherAccounts[0]
    const voter1 = otherAccounts[1]
    const voter2 = otherAccounts[2]

    await getVot3Tokens(proposer, "30000")
    await getVot3Tokens(voter1, "50000")
    await getVot3Tokens(voter2, "50000")

    // Whitelist for personhood
    await veBetterPassport.connect(owner).whitelist(proposer.address)
    await veBetterPassport.connect(owner).whitelist(voter1.address)
    await veBetterPassport.connect(owner).whitelist(voter2.address)

    // --- Verify V10 deployed through full upgrade chain ---
    expect(await governor.version()).to.equal("10")

    // --- Create proposal ---
    const functionToCall = "setMinVotingDelay"
    const description = "Test proposal for upgrade verification"
    const descriptionHash = ethers.id(description)

    const tx = await governor.connect(proposer).propose(
      [await governor.getAddress()],
      [0],
      [governor.interface.encodeFunctionData(functionToCall, [2])],
      description,
      0, // standard proposal
      0, // no specific round
    )
    const receipt = await tx.wait()
    const proposalId = await governor.hashProposal(
      [await governor.getAddress()],
      [0],
      [governor.interface.encodeFunctionData(functionToCall, [2])],
      descriptionHash,
    )

    // Deposit to meet threshold
    await vot3.connect(proposer).approve(await governor.getAddress(), ethers.parseEther("10000"))
    await governor.connect(proposer).deposit(ethers.parseEther("10000"), proposalId)

    // Wait for proposal to become active
    await waitForProposalToBeActive(proposalId)

    // Cast votes
    await governor.connect(voter1).castVote(proposalId, 1) // For
    await governor.connect(voter2).castVote(proposalId, 0) // Against

    // --- Record pre-upgrade state ---
    const preUpgradeProposalState = await governor.state(proposalId)
    const preUpgradeProposer = await governor.proposalProposer(proposalId)
    const preUpgradeHasVotedVoter1 = await governor.hasVoted(proposalId, voter1.address)
    const preUpgradeHasVotedVoter2 = await governor.hasVoted(proposalId, voter2.address)
    const preUpgradeSnapshot = await governor.proposalSnapshot(proposalId)
    const preUpgradeDeadline = await governor.proposalDeadline(proposalId)
    const preUpgradeToken = await governor.token()
    const preUpgradeB3tr = await governor.b3tr()
    const preUpgradeVoterRewards = await governor.voterRewards()
    const preUpgradeXAllocationVoting = await governor.xAllocationVoting()
    const preUpgradeDepositThreshold = await governor.depositThreshold()
    const preUpgradeMinVotingDelay = await governor.minVotingDelay()

    // Roles
    const DEFAULT_ADMIN_ROLE = await governor.DEFAULT_ADMIN_ROLE()
    const GOVERNOR_FUNCTIONS_SETTINGS_ROLE = await governor.GOVERNOR_FUNCTIONS_SETTINGS_ROLE()
    const PAUSER_ROLE = await governor.PAUSER_ROLE()
    const PROPOSAL_STATE_MANAGER_ROLE = await governor.PROPOSAL_STATE_MANAGER_ROLE()

    expect(await governor.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true
    expect(await governor.hasRole(GOVERNOR_FUNCTIONS_SETTINGS_ROLE, owner.address)).to.be.true
    expect(await governor.hasRole(PAUSER_ROLE, owner.address)).to.be.true

    // --- Verify proposal state after full upgrade chain (V1→...→V9→V10) ---
    expect(await governor.state(proposalId)).to.equal(preUpgradeProposalState)
    expect(await governor.proposalProposer(proposalId)).to.equal(preUpgradeProposer)
    expect(await governor.hasVoted(proposalId, voter1.address)).to.equal(preUpgradeHasVotedVoter1)
    expect(await governor.hasVoted(proposalId, voter2.address)).to.equal(preUpgradeHasVotedVoter2)
    expect(await governor.proposalSnapshot(proposalId)).to.equal(preUpgradeSnapshot)
    expect(await governor.proposalDeadline(proposalId)).to.equal(preUpgradeDeadline)

    // --- Verify external contract references ---
    expect(await governor.token()).to.equal(preUpgradeToken)
    expect(await governor.b3tr()).to.equal(preUpgradeB3tr)
    expect(await governor.voterRewards()).to.equal(preUpgradeVoterRewards)
    expect(await governor.xAllocationVoting()).to.equal(preUpgradeXAllocationVoting)

    // --- Verify governance settings ---
    expect(await governor.depositThreshold()).to.equal(preUpgradeDepositThreshold)
    expect(await governor.minVotingDelay()).to.equal(preUpgradeMinVotingDelay)

    // --- Verify roles ---
    expect(await governor.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true
    expect(await governor.hasRole(GOVERNOR_FUNCTIONS_SETTINGS_ROLE, owner.address)).to.be.true
    expect(await governor.hasRole(PAUSER_ROLE, owner.address)).to.be.true
    expect(await governor.hasRole(PROPOSAL_STATE_MANAGER_ROLE, owner.address)).to.be.true

    // --- Verify new proposals can still be created ---
    const description2 = "Post-upgrade proposal"
    await governor
      .connect(proposer)
      .propose(
        [await governor.getAddress()],
        [0],
        [governor.interface.encodeFunctionData(functionToCall, [3])],
        description2,
        0,
        0,
      )
  })
})
