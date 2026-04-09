import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { expect } from "chai"
import { ethers } from "hardhat"
import { describe, it } from "mocha"

import { getOrDeployContractInstances } from "../helpers"
import { getVot3Tokens } from "../helpers/common"

describe("VOT3 - V2 Upgrade - @shard19a", function () {
  it("Should deploy through full upgrade chain and report version 2", async () => {
    const config = createLocalConfig()
    const { vot3 } = await getOrDeployContractInstances({ forceDeploy: true, config })

    expect(await vot3.version()).to.equal("2")
    expect(await vot3.getAddress()).to.not.equal(ethers.ZeroAddress)
  })

  it("Should have NavigatorRegistry set after initializeV2", async () => {
    const config = createLocalConfig()
    const { vot3, navigatorRegistry } = await getOrDeployContractInstances({ forceDeploy: true, config })

    const lockedAmount = await vot3.getNavigatorLockedAmount(ethers.ZeroAddress)
    expect(lockedAmount).to.equal(0n)

    // NavigatorRegistry should be wired
    expect(await navigatorRegistry.getAddress()).to.not.equal(ethers.ZeroAddress)
  })

  it("Should preserve B3TR reference after upgrade", async () => {
    const config = createLocalConfig()
    const { vot3, b3tr } = await getOrDeployContractInstances({ forceDeploy: true, config })

    expect(await vot3.b3tr()).to.equal(await b3tr.getAddress())
  })

  it("Should preserve roles after upgrade", async () => {
    const config = createLocalConfig()
    const { vot3, owner } = await getOrDeployContractInstances({ forceDeploy: true, config })

    expect(await vot3.hasRole(await vot3.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true
    expect(await vot3.hasRole(await vot3.UPGRADER_ROLE(), owner.address)).to.be.true
    expect(await vot3.hasRole(await vot3.PAUSER_ROLE(), owner.address)).to.be.true
  })

  it("Should still allow convertToVOT3 and convertToB3TR after upgrade", async () => {
    const config = createLocalConfig()
    const { vot3, b3tr, owner, otherAccount, minterAccount } = await getOrDeployContractInstances({
      forceDeploy: true,
      config,
    })

    // Mint B3TR to owner so we can transfer
    const amount = ethers.parseEther("100")
    await b3tr.connect(minterAccount).mint(owner.address, amount)
    await b3tr.connect(owner).transfer(otherAccount.address, amount)

    // Approve and convert to VOT3
    await b3tr.connect(otherAccount).approve(await vot3.getAddress(), amount)
    await vot3.connect(otherAccount).convertToVOT3(amount)
    expect(await vot3.balanceOf(otherAccount.address)).to.equal(amount)

    // Convert back to B3TR
    await vot3.connect(otherAccount).convertToB3TR(amount)
    expect(await vot3.balanceOf(otherAccount.address)).to.equal(0n)
    expect(await b3tr.balanceOf(otherAccount.address)).to.equal(amount)
  })

  it("Should enforce delegation lock after upgrade — transfer blocked for locked portion", async () => {
    const config = createLocalConfig()
    const { vot3, b3tr, navigatorRegistry, owner, otherAccounts, minterAccount } = await getOrDeployContractInstances({
      forceDeploy: true,
      config,
    })

    const navigator = otherAccounts[10]
    const citizen = otherAccounts[11]
    const recipient = otherAccounts[12]

    // Mint B3TR to owner for distribution
    await b3tr.connect(minterAccount).mint(owner.address, ethers.parseEther("10000000"))

    // Ensure VOT3 supply exists for max stake check
    await getVot3Tokens(owner, "10000000")

    // Register navigator
    const stakeAmount = ethers.parseEther("50000")
    await b3tr.connect(owner).transfer(navigator.address, stakeAmount)
    await b3tr.connect(navigator).approve(await navigatorRegistry.getAddress(), stakeAmount)
    await navigatorRegistry.connect(navigator).register(stakeAmount, "ipfs://nav")

    // Give citizen 1000 VOT3
    await getVot3Tokens(citizen, "1000")

    // Delegate 500 VOT3
    const delegateAmount = ethers.parseEther("500")
    await navigatorRegistry.connect(citizen).delegate(navigator.address, delegateAmount)

    // Locked = 500, free = 500
    expect(await vot3.getNavigatorLockedAmount(citizen.address)).to.equal(delegateAmount)

    // Transfer 500 (free portion) should succeed
    await vot3.connect(citizen).transfer(recipient.address, ethers.parseEther("500"))

    // Transfer 1 more wei should fail (would go below locked amount)
    await expect(vot3.connect(citizen).transfer(recipient.address, 1n)).to.be.revertedWith(
      "VOT3: transfer exceeds unlocked balance",
    )

    // Undelegate: lock released
    await navigatorRegistry.connect(citizen).undelegate()
    expect(await vot3.getNavigatorLockedAmount(citizen.address)).to.equal(0n)
  })

  it("Should not allow re-initialization of V2", async () => {
    const config = createLocalConfig()
    const { vot3 } = await getOrDeployContractInstances({ forceDeploy: true, config })

    await expect(vot3.initializeV2(ethers.ZeroAddress)).to.be.reverted
  })
})
