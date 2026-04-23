import { expect } from "chai"
import { describe, it, beforeEach } from "mocha"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { ethers } from "hardhat"
import { deployProxy, upgradeProxy } from "../../scripts/helpers"
import { getOrDeployContractInstances, waitForNextCycle } from "../helpers"
import {
  B3TR,
  Emissions,
  RelayerRewardsPool,
  RelayerRewardsPoolV1,
  RelayerRewardsPoolV2,
  XAllocationVoting,
} from "../../typechain-types"

describe("RelayerRewardsPool - V2 Upgrade - @shard18", function () {
  let b3tr: B3TR
  let emissions: Emissions
  let xAllocationVoting: XAllocationVoting
  let owner: HardhatEthersSigner
  let minterAccount: HardhatEthersSigner
  let relayer1: HardhatEthersSigner
  let user1: HardhatEthersSigner

  beforeEach(async function () {
    const config = await getOrDeployContractInstances({
      forceDeploy: true,
    })
    if (!config) throw new Error("Failed to deploy contracts")

    b3tr = config.b3tr
    emissions = config.emissions
    xAllocationVoting = config.xAllocationVoting
    owner = config.owner
    minterAccount = config.minterAccount
    relayer1 = config.otherAccounts[2]
    user1 = config.otherAccounts[4]

    await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), owner.address)
    await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())
    await emissions.connect(minterAccount).bootstrap()
    await emissions.connect(minterAccount).start()
  })

  it("should preserve v1 state through V1 → V2 → V3 upgrade path", async function () {
    const relayerRewardsPoolV1 = (await deployProxy("RelayerRewardsPoolV1", [
      owner.address,
      owner.address,
      await b3tr.getAddress(),
      await emissions.getAddress(),
      await xAllocationVoting.getAddress(),
    ])) as RelayerRewardsPoolV1

    expect(await relayerRewardsPoolV1.version()).to.equal("1")

    await relayerRewardsPoolV1.registerRelayer(relayer1.address)
    await relayerRewardsPoolV1.setEarlyAccessBlocks(123)
    await relayerRewardsPoolV1.setTotalActionsForRound(1, 2)

    const depositAmount = ethers.parseEther("10")
    await b3tr.connect(owner).mint(owner.address, depositAmount)
    await b3tr.connect(owner).approve(await relayerRewardsPoolV1.getAddress(), depositAmount)
    await relayerRewardsPoolV1.deposit(depositAmount, 1)

    await waitForNextCycle(emissions)

    // V1 → V2
    const relayerRewardsPoolV2 = (await upgradeProxy(
      "RelayerRewardsPoolV1",
      "RelayerRewardsPoolV2",
      await relayerRewardsPoolV1.getAddress(),
      [],
      { version: 2 },
    )) as RelayerRewardsPoolV2

    expect(await relayerRewardsPoolV2.version()).to.equal("2")
    expect(await relayerRewardsPoolV2.isRegisteredRelayer(relayer1.address)).to.equal(true)
    expect(await relayerRewardsPoolV2.getEarlyAccessBlocks()).to.equal(123)
    expect(await relayerRewardsPoolV2.totalActions(1)).to.equal(4)
    expect(await relayerRewardsPoolV2.getTotalRewards(1)).to.equal(depositAmount)

    // V2 → V3 (current)
    const relayerRewardsPoolV3 = (await upgradeProxy(
      "RelayerRewardsPoolV2",
      "RelayerRewardsPool",
      await relayerRewardsPoolV2.getAddress(),
      [],
      { version: 3 },
    )) as RelayerRewardsPool

    expect(await relayerRewardsPoolV3.version()).to.equal("3")
    expect(await relayerRewardsPoolV3.isRegisteredRelayer(relayer1.address)).to.equal(true)
    expect(await relayerRewardsPoolV3.getEarlyAccessBlocks()).to.equal(123)
    expect(await relayerRewardsPoolV3.totalActions(1)).to.equal(4)
    expect(await relayerRewardsPoolV3.getTotalRewards(1)).to.equal(depositAmount)
    expect(await relayerRewardsPoolV3.getPreferredRelayer(user1.address)).to.equal(ethers.ZeroAddress)

    await expect(relayerRewardsPoolV3.connect(user1).setPreferredRelayer(relayer1.address))
      .to.emit(relayerRewardsPoolV3, "PreferredRelayerSet")
      .withArgs(user1.address, relayer1.address)

    expect(await relayerRewardsPoolV3.getPreferredRelayer(user1.address)).to.equal(relayer1.address)
  })
})
