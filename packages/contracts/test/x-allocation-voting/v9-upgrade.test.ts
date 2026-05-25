import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { expect } from "chai"
import { ethers } from "hardhat"
import { describe, it } from "mocha"

import { getOrDeployContractInstances } from "../helpers"

describe("XAllocationVoting - V10 Upgrade - @shard14a", function () {
  it("Should deploy through full upgrade chain and report version 10", async () => {
    const config = createLocalConfig()
    const { xAllocationVoting } = await getOrDeployContractInstances({ forceDeploy: true, config })

    expect(await xAllocationVoting.version()).to.equal("10")
    expect(await xAllocationVoting.getAddress()).to.not.equal(ethers.ZeroAddress)
  })

  it("Should preserve roles after upgrade chain", async () => {
    const config = createLocalConfig()
    const { xAllocationVoting, owner } = await getOrDeployContractInstances({ forceDeploy: true, config })

    expect(await xAllocationVoting.hasRole(await xAllocationVoting.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true
    expect(await xAllocationVoting.hasRole(await xAllocationVoting.GOVERNANCE_ROLE(), owner.address)).to.be.true
  })

  it("Should preserve voting settings after upgrade chain", async () => {
    const config = createLocalConfig()
    const { xAllocationVoting } = await getOrDeployContractInstances({ forceDeploy: true, config })

    expect(await xAllocationVoting.votingPeriod()).to.equal(config.EMISSIONS_CYCLE_DURATION - 1)
  })
})
