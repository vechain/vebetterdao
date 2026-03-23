import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { expect } from "chai"
import { ethers } from "hardhat"
import { describe, it } from "mocha"

import { getOrDeployContractInstances } from "../helpers"

describe("Governance - V10 Upgrade - @shard4g", function () {
  it("Should deploy through full upgrade chain and report version 10", async () => {
    const config = createLocalConfig()
    const { governor } = await getOrDeployContractInstances({ forceDeploy: true, config })

    expect(await governor.version()).to.equal("10")
    expect(await governor.getAddress()).to.not.equal(ethers.ZeroAddress)
  })

  it("Should preserve external contract references after upgrade chain", async () => {
    const config = createLocalConfig()
    const { governor, vot3, b3tr, voterRewards, xAllocationVoting } = await getOrDeployContractInstances({
      forceDeploy: true,
      config,
    })

    expect(await governor.token()).to.equal(await vot3.getAddress())
    expect(await governor.b3tr()).to.equal(await b3tr.getAddress())
    expect(await governor.voterRewards()).to.equal(await voterRewards.getAddress())
    expect(await governor.xAllocationVoting()).to.equal(await xAllocationVoting.getAddress())
  })

  it("Should preserve roles after upgrade chain", async () => {
    const config = createLocalConfig()
    const { governor, owner } = await getOrDeployContractInstances({ forceDeploy: true, config })

    expect(await governor.hasRole(await governor.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true
    expect(await governor.hasRole(await governor.GOVERNOR_FUNCTIONS_SETTINGS_ROLE(), owner.address)).to.be.true
    expect(await governor.hasRole(await governor.PAUSER_ROLE(), owner.address)).to.be.true
    expect(await governor.hasRole(await governor.PROPOSAL_STATE_MANAGER_ROLE(), owner.address)).to.be.true
  })

  it("Should preserve governance settings after upgrade chain", async () => {
    const config = createLocalConfig()
    const { governor } = await getOrDeployContractInstances({ forceDeploy: true, config })

    expect(await governor.minVotingDelay()).to.equal(config.B3TR_GOVERNOR_MIN_VOTING_DELAY)
  })
})
