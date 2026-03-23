import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { expect } from "chai"
import { ethers } from "hardhat"
import { describe, it } from "mocha"

import { XAllocationVoting } from "../../typechain-types"
import { bootstrapAndStartEmissions, getOrDeployContractInstances, getVot3Tokens, waitForRoundToEnd } from "../helpers"

describe("XAllocationVoting - V9 Upgrade - @shard14a", function () {
  it("Should deploy through full upgrade chain (V1→...→V8→V9) and preserve all state", async () => {
    const config = createLocalConfig()
    const { xAllocationVoting, owner, otherAccounts, emissions, x2EarnApps, veBetterPassport } =
      await getOrDeployContractInstances({ forceDeploy: true, config })

    // --- Verify V9 deployed through full upgrade chain ---
    expect(await xAllocationVoting.version()).to.equal("9")

    // --- Setup ---
    await bootstrapAndStartEmissions()

    const voter1 = otherAccounts[1]
    const voter2 = otherAccounts[2]

    await getVot3Tokens(voter1, "10000")
    await getVot3Tokens(voter2, "10000")

    await veBetterPassport.connect(owner).whitelist(voter1.address)
    await veBetterPassport.connect(owner).whitelist(voter2.address)

    // Get eligible apps from deploy helper
    const eligibleApps = await x2EarnApps.allEligibleApps()
    expect(eligibleApps.length).to.be.gte(2, "Need at least 2 eligible apps from deploy")
    const app1Id = eligibleApps[0]
    const app2Id = eligibleApps[1]

    // --- Round 1: Cast votes ---
    const roundId = await xAllocationVoting.currentRoundId()

    await xAllocationVoting
      .connect(voter1)
      .castVote(roundId, [app1Id, app2Id], [ethers.parseEther("500"), ethers.parseEther("300")])
    await xAllocationVoting.connect(voter2).castVote(roundId, [app1Id], [ethers.parseEther("1000")])

    // --- Setup auto-voting for voter1 ---
    await xAllocationVoting.connect(voter1).setUserVotingPreferences([app1Id, app2Id])
    await xAllocationVoting.connect(voter1).toggleAutoVoting(voter1.address)

    // --- Verify vote data ---
    expect(await xAllocationVoting.getAppVotes(roundId, app1Id)).to.equal(ethers.parseEther("1500"))
    expect(await xAllocationVoting.getAppVotes(roundId, app2Id)).to.equal(ethers.parseEther("300"))
    expect(await xAllocationVoting.hasVoted(roundId, voter1.address)).to.be.true
    expect(await xAllocationVoting.hasVoted(roundId, voter2.address)).to.be.true

    // --- Verify auto-voting state ---
    expect(await xAllocationVoting.isUserAutoVotingEnabled(voter1.address)).to.be.true
    const preferences = await xAllocationVoting.getUserVotingPreferences(voter1.address)
    expect(preferences).to.have.lengthOf(2)

    // --- Verify settings ---
    expect(await xAllocationVoting.votingPeriod()).to.be.gt(0)

    // --- Verify roles ---
    const DEFAULT_ADMIN_ROLE = await xAllocationVoting.DEFAULT_ADMIN_ROLE()
    const GOVERNANCE_ROLE = await xAllocationVoting.GOVERNANCE_ROLE()
    expect(await xAllocationVoting.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true
    expect(await xAllocationVoting.hasRole(GOVERNANCE_ROLE, owner.address)).to.be.true

    // --- Verify round is active and can complete ---
    expect(await xAllocationVoting.state(roundId)).to.equal(0n) // Active

    // --- Verify new round can start ---
    await waitForRoundToEnd(Number(roundId))
    const nextCycleBlock = await emissions.getNextCycleBlock()
    const currentBlock = await ethers.provider.getBlockNumber()
    if (currentBlock < Number(nextCycleBlock)) {
      for (let i = 0; i < Number(nextCycleBlock) - currentBlock + 1; i++) {
        await ethers.provider.send("evm_mine", [])
      }
    }
    await emissions.distribute()
    const newRoundId = await xAllocationVoting.currentRoundId()
    expect(newRoundId).to.be.gt(roundId)
  })
})
