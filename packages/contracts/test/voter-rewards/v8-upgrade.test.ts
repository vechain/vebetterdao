import { expect } from "chai"
import { ethers } from "hardhat"
import { describe, it } from "mocha"

import { getOrDeployContractInstances } from "../helpers"

/**
 * V8 is a logic-only upgrade (no new storage, no reinitializer). This suite
 * confirms the V6→V7→V8 chain reports version 8 and that V7-era state (which
 * was the most recent storage migration) survives the V8 implementation swap.
 */
describe("VoterRewards - V8 Upgrade - @shard21", function () {
  it("reports version 8 after the full V6→V7→V8 chain", async () => {
    const { voterRewards } = await getOrDeployContractInstances({ forceDeploy: true })
    expect(await voterRewards.version()).to.equal("8")
    expect(await voterRewards.getAddress()).to.not.equal(ethers.ZeroAddress)
  })

  it("preserves V7 storage (navigatorRegistry address) across the V8 upgrade", async () => {
    const { voterRewards, navigatorRegistry } = await getOrDeployContractInstances({ forceDeploy: true })
    expect(await voterRewards.navigatorRegistry()).to.equal(await navigatorRegistry.getAddress())
  })

  it("preserves V7 storage (freshness + intent multipliers) across the V8 upgrade", async () => {
    const { voterRewards } = await getOrDeployContractInstances({ forceDeploy: true })
    const block = await ethers.provider.getBlockNumber()
    const [t1, t2, t3] = await voterRewards.getFreshnessMultipliers(block)
    const [ifa, iab] = await voterRewards.getIntentMultipliers(block)
    expect(t1).to.be.gt(0n)
    expect(t2).to.be.gt(0n)
    expect(t3).to.be.gt(0n)
    expect(ifa).to.be.gt(0n)
    expect(iab).to.be.gt(0n)
  })

  it("preserves roles after the V8 upgrade", async () => {
    const { voterRewards, owner } = await getOrDeployContractInstances({ forceDeploy: true })
    expect(await voterRewards.hasRole(await voterRewards.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true
  })
})
