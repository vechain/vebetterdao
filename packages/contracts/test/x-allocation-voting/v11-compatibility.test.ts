import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { expect } from "chai"
import { ethers } from "hardhat"
import { describe, it } from "mocha"

import { getOrDeployContractInstances, getVot3Tokens, waitForNextBlock } from "../helpers"
import { bootstrapAndStartEmissions } from "../helpers"
import { endorseApp } from "../helpers/xnodes"

/**
 * V11 changes behaviour only inside castVoteOnBehalfOf's skip branch and castNavigatorVote's
 * preference handling. It adds, reorders and retypes no storage. These assertions cover the
 * state that survives the V10 -> V11 upgrade in the deploy chain.
 */
describe("XAllocationVoting - V11 Compatibility - @shard14a", function () {
  it("preserves roles through the upgrade chain", async () => {
    const config = createLocalConfig()
    const { xAllocationVoting, owner, timeLock } = await getOrDeployContractInstances({ forceDeploy: true, config })

    expect(await xAllocationVoting.hasRole(await xAllocationVoting.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true
    expect(await xAllocationVoting.hasRole(await xAllocationVoting.GOVERNANCE_ROLE(), owner.address)).to.be.true
    expect(await xAllocationVoting.hasRole(await xAllocationVoting.DEFAULT_ADMIN_ROLE(), await timeLock.getAddress()))
      .to.be.true
  })

  it("preserves voting settings and external contract wiring", async () => {
    const config = createLocalConfig()
    const { xAllocationVoting, navigatorRegistry } = await getOrDeployContractInstances({
      forceDeploy: true,
      config,
    })

    expect(await xAllocationVoting.votingPeriod()).to.equal(config.EMISSIONS_CYCLE_DURATION - 1)
    expect(await xAllocationVoting.votingThreshold()).to.equal(config.X_ALLOCATION_VOTING_VOTING_THRESHOLD)
    expect(await xAllocationVoting.quorumPercentage()).to.equal(config.X_ALLOCATION_VOTING_QUORUM_PERCENTAGE)
    expect(await xAllocationVoting.appSharesCap()).to.equal(config.X_ALLOCATION_POOL_APP_SHARES_MAX_CAP)
    expect(await xAllocationVoting.baseAllocationPercentage()).to.equal(
      config.X_ALLOCATION_POOL_BASE_ALLOCATION_PERCENTAGE,
    )
    // V9 wiring must survive the V10 -> V11 hop
    expect(await xAllocationVoting.navigatorRegistry()).to.equal(await navigatorRegistry.getAddress())
    expect(await xAllocationVoting.getAddress()).to.not.equal(ethers.ZeroAddress)
  })

  it("preserves the V9 citizen skip window", async () => {
    const config = createLocalConfig()
    const { xAllocationVoting } = await getOrDeployContractInstances({ forceDeploy: true, config })

    expect(await xAllocationVoting.citizenSkipWindowBlocks()).to.equal(config.XALLOCATION_CITIZEN_SKIP_WINDOW_BLOCKS)
  })

  it("keeps auto-voting preferences and status readable across the upgrade", async () => {
    const config = createLocalConfig()
    const { xAllocationVoting, x2EarnApps, otherAccounts, creators, veBetterPassport } =
      await getOrDeployContractInstances({ forceDeploy: true, config })

    const user = otherAccounts[13]

    await x2EarnApps.connect(creators[0]).submitApp(creators[0].address, creators[0].address, "CompatApp", "uri")
    const appId = await x2EarnApps.hashAppName("CompatApp")
    await endorseApp(appId, otherAccounts[4])

    if (!(await veBetterPassport.isCheckEnabled(1))) await veBetterPassport.toggleCheck(1)
    await veBetterPassport.whitelist(user.address)
    await getVot3Tokens(user, "100")

    await bootstrapAndStartEmissions()
    await waitForNextBlock()

    await xAllocationVoting.connect(user).setUserVotingPreferences([appId])
    await xAllocationVoting.connect(user).toggleAutoVoting(user.address)

    expect(await xAllocationVoting.getUserVotingPreferences(user.address)).to.deep.equal([appId])
    expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.true
  })
})
