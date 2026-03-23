import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { expect } from "chai"
import { ethers } from "hardhat"
import { describe, it } from "mocha"

import { upgradeProxy } from "../../scripts/helpers"
import { autoVotingLibraries } from "../../scripts/libraries"
import { XAllocationVoting } from "../../typechain-types"
import { bootstrapAndStartEmissions, getOrDeployContractInstances, getVot3Tokens, waitForRoundToEnd } from "../helpers"
import { endorseApp } from "../helpers/xnodes"

describe("XAllocationVoting - V9 Upgrade - @shard14a", function () {
  it("Should upgrade from V8 to V9 preserving votes, rounds, and auto-voting state", async () => {
    const config = createLocalConfig()
    const {
      xAllocationVoting,
      owner,
      otherAccounts,
      vot3,
      b3tr,
      emissions,
      x2EarnApps,
      veBetterPassport,
      x2EarnCreator,
    } = await getOrDeployContractInstances({ forceDeploy: true, config })

    // --- Setup ---
    await bootstrapAndStartEmissions()

    const voter1 = otherAccounts[1]
    const voter2 = otherAccounts[2]
    const appCreator1 = otherAccounts[10]
    const appCreator2 = otherAccounts[11]

    await getVot3Tokens(voter1, "10000")
    await getVot3Tokens(voter2, "10000")

    await veBetterPassport.connect(owner).whitelist(voter1.address)
    await veBetterPassport.connect(owner).whitelist(voter2.address)

    // Create apps
    await x2EarnCreator.connect(owner).safeMint(appCreator1.address)
    await x2EarnApps.connect(appCreator1).submitApp(appCreator1.address, appCreator1.address, "App1", "uri")
    const app1Id = await x2EarnApps.hashAppName("App1")
    await endorseApp(app1Id, otherAccounts[15])

    await x2EarnCreator.connect(owner).safeMint(appCreator2.address)
    await x2EarnApps.connect(appCreator2).submitApp(appCreator2.address, appCreator2.address, "App2", "uri")
    const app2Id = await x2EarnApps.hashAppName("App2")
    await endorseApp(app2Id, otherAccounts[16])

    // --- Pre-upgrade state: Verify V8 ---
    expect(await xAllocationVoting.version()).to.equal("8")

    // --- Round 1: Cast votes ---
    const roundId = await xAllocationVoting.currentRoundId()

    await xAllocationVoting
      .connect(voter1)
      .castVote(roundId, [app1Id, app2Id], [ethers.parseEther("500"), ethers.parseEther("300")])
    await xAllocationVoting.connect(voter2).castVote(roundId, [app1Id], [ethers.parseEther("1000")])

    // --- Setup auto-voting for voter1 ---
    await xAllocationVoting.connect(voter1).setUserVotingPreferences([app1Id, app2Id])
    await xAllocationVoting.connect(voter1).toggleAutoVoting(voter1.address)

    // --- Record pre-upgrade state ---
    const preUpgradeApp1Votes = await xAllocationVoting.getAppVotes(roundId, app1Id)
    const preUpgradeApp2Votes = await xAllocationVoting.getAppVotes(roundId, app2Id)
    const preUpgradeVoter1HasVoted = await xAllocationVoting.hasVoted(roundId, voter1.address)
    const preUpgradeVoter2HasVoted = await xAllocationVoting.hasVoted(roundId, voter2.address)
    const preUpgradeAutoVotingEnabled = await xAllocationVoting.isUserAutoVotingEnabled(voter1.address)
    const preUpgradePreferences = await xAllocationVoting.getUserVotingPreferences(voter1.address)
    const preUpgradeVotingPeriod = await xAllocationVoting.votingPeriod()
    const preUpgradeVoterRewards = await xAllocationVoting.voterRewards()
    const preUpgradeEmissions = await xAllocationVoting.emissions()

    // Roles
    const DEFAULT_ADMIN_ROLE = await xAllocationVoting.DEFAULT_ADMIN_ROLE()
    const GOVERNANCE_ROLE = await xAllocationVoting.GOVERNANCE_ROLE()
    const ROUND_STARTER_ROLE = await xAllocationVoting.ROUND_STARTER_ROLE()

    expect(preUpgradeVoter1HasVoted).to.be.true
    expect(preUpgradeVoter2HasVoted).to.be.true
    expect(preUpgradeAutoVotingEnabled).to.be.true
    expect(preUpgradePreferences).to.have.lengthOf(2)

    // --- Upgrade V8 → V9 ---
    const { AutoVotingLogic } = await autoVotingLibraries()

    const xAllocationVotingV9 = (await upgradeProxy(
      "XAllocationVotingV8",
      "XAllocationVoting",
      await xAllocationVoting.getAddress(),
      [],
      {
        version: 9,
        libraries: {
          AutoVotingLogic: await AutoVotingLogic.getAddress(),
        },
      },
    )) as XAllocationVoting

    // --- Verify V9 ---
    expect(await xAllocationVotingV9.version()).to.equal("9")

    // --- Verify votes preserved ---
    expect(await xAllocationVotingV9.getAppVotes(roundId, app1Id)).to.equal(preUpgradeApp1Votes)
    expect(await xAllocationVotingV9.getAppVotes(roundId, app2Id)).to.equal(preUpgradeApp2Votes)
    expect(await xAllocationVotingV9.hasVoted(roundId, voter1.address)).to.equal(preUpgradeVoter1HasVoted)
    expect(await xAllocationVotingV9.hasVoted(roundId, voter2.address)).to.equal(preUpgradeVoter2HasVoted)

    // --- Verify auto-voting state preserved ---
    expect(await xAllocationVotingV9.isUserAutoVotingEnabled(voter1.address)).to.equal(preUpgradeAutoVotingEnabled)
    const postUpgradePreferences = await xAllocationVotingV9.getUserVotingPreferences(voter1.address)
    expect(postUpgradePreferences).to.deep.equal(preUpgradePreferences)

    // --- Verify settings preserved ---
    expect(await xAllocationVotingV9.votingPeriod()).to.equal(preUpgradeVotingPeriod)
    expect(await xAllocationVotingV9.voterRewards()).to.equal(preUpgradeVoterRewards)
    expect(await xAllocationVotingV9.emissions()).to.equal(preUpgradeEmissions)

    // --- Verify roles preserved ---
    expect(await xAllocationVotingV9.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true
    expect(await xAllocationVotingV9.hasRole(GOVERNANCE_ROLE, owner.address)).to.be.true

    // --- Verify round still active and can complete ---
    expect(await xAllocationVotingV9.state(roundId)).to.equal(0n) // Active

    // --- Verify new round can start after upgrade ---
    await waitForRoundToEnd(Number(roundId))
    const nextCycleBlock = await emissions.getNextCycleBlock()
    const currentBlock = await ethers.provider.getBlockNumber()
    if (currentBlock < Number(nextCycleBlock)) {
      for (let i = 0; i < Number(nextCycleBlock) - currentBlock + 1; i++) {
        await ethers.provider.send("evm_mine", [])
      }
    }
    await emissions.distribute()
    const newRoundId = await xAllocationVotingV9.currentRoundId()
    expect(newRoundId).to.be.gt(roundId)
  })
})
