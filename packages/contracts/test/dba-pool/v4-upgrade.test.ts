import { ethers } from "hardhat"
import { expect } from "chai"
import { describe, it } from "mocha"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import {
  bootstrapEmissions,
  endorseApp,
  getOrDeployContractInstances,
  getVot3Tokens,
  waitForRoundToEnd,
} from "../helpers"
import { deployProxy, upgradeProxy } from "../../scripts/helpers"
import { DBAPoolV1, DBAPoolV2, DBAPoolV3, DBAPool } from "../../typechain-types"

/**
 * Verifies that the V3 → V4 upgrade preserves all V3 storage (treasuryAddress,
 * meritCapMultiplier, distributionStartRound, dbaRewardsDistributed,
 * dbaRoundRewardsForApp) and wires the new V4 fields (veBetterPassport,
 * xAllocationVoting). The DBA pool is upgradeable so any storage corruption would
 * break in-flight reward tracking.
 */
describe("DBA Pool - V4 Upgrade @shard7d", () => {
  let owner: HardhatEthersSigner
  let otherAccount: HardhatEthersSigner

  it("Should preserve V3 storage and wire V4 dependencies after upgrade from V3", async function () {
    this.timeout(180000)

    const {
      owner: o,
      otherAccount: oa,
      b3tr,
      x2EarnApps,
      xAllocationPool,
      x2EarnRewardsPool,
      veBetterPassport,
      xAllocationVoting,
    } = await getOrDeployContractInstances({
      forceDeploy: true,
    })
    owner = o
    otherAccount = oa

    // Deploy V1 → V2 → V3 chain manually so we exercise the on-disk migration path
    const dbaPoolV1 = (await deployProxy("DBAPoolV1", [
      {
        admin: owner.address,
        x2EarnApps: await x2EarnApps.getAddress(),
        xAllocationPool: await xAllocationPool.getAddress(),
        x2earnRewardsPool: await x2EarnRewardsPool.getAddress(),
        b3tr: await b3tr.getAddress(),
        distributionStartRound: 7,
      },
    ])) as DBAPoolV1

    const UPGRADER_ROLE = await dbaPoolV1.UPGRADER_ROLE()
    await (await dbaPoolV1.connect(owner).grantRole(UPGRADER_ROLE, owner.address)).wait()

    const dbaPoolV2 = (await upgradeProxy("DBAPoolV1", "DBAPoolV2", await dbaPoolV1.getAddress(), [], {
      version: 2,
      logOutput: false,
    })) as DBAPoolV2

    const treasuryAddr = otherAccount.address
    const dbaPoolV3 = (await upgradeProxy("DBAPoolV2", "DBAPoolV3", await dbaPoolV2.getAddress(), [treasuryAddr], {
      version: 3,
      logOutput: false,
    })) as DBAPoolV3

    // Seed some state at V3 that must survive upgrade to V4
    const seededRound = 9n
    const seededAppId = ethers.keccak256(ethers.toUtf8Bytes("seeded-app"))
    // Submit + endorse seededAppId so the seed call passes its appExists check
    const { creators, otherAccounts } = await getOrDeployContractInstances({})
    await x2EarnApps
      .connect(creators[0])
      .submitApp(otherAccounts[5].address, otherAccounts[5].address, "seeded-app", "metadataURI")
    await endorseApp(seededAppId, otherAccounts[0])

    const seededAmount = ethers.parseEther("42")
    await dbaPoolV3.connect(owner).seedDBARewardsForApps([seededRound], [seededAppId], [seededAmount])

    expect(await dbaPoolV3.version()).to.equal("3")
    expect(await dbaPoolV3.treasuryAddress()).to.equal(treasuryAddr)
    expect(await dbaPoolV3.meritCapMultiplier()).to.equal(2n)
    expect(await dbaPoolV3.dbaRoundRewardsForApp(seededRound, seededAppId)).to.equal(seededAmount)
    expect(await dbaPoolV3.distributionStartRound()).to.equal(7n)

    // Snapshot the V3 contract addresses for cross-version assertions
    const v3X2EarnApps = await dbaPoolV3.x2EarnApps()
    const v3XAllocationPool = await dbaPoolV3.xAllocationPool()
    const v3X2EarnRewardsPool = await dbaPoolV3.x2EarnRewardsPool()
    const v3B3TR = await dbaPoolV3.b3tr()

    // Upgrade V3 → V4 using the upgrade helper (same path used by deployAll)
    const veBetterPassportAddress = await veBetterPassport.getAddress()
    const xAllocationVotingAddress = await xAllocationVoting.getAddress()
    const dbaPoolV4 = (await upgradeProxy(
      "DBAPoolV3",
      "DBAPool",
      await dbaPoolV3.getAddress(),
      [veBetterPassportAddress, xAllocationVotingAddress],
      {
        version: 4,
        logOutput: false,
      },
    )) as DBAPool

    // V4 surface
    expect(await dbaPoolV4.version()).to.equal("4")
    expect(await dbaPoolV4.veBetterPassport()).to.equal(veBetterPassportAddress)
    expect(await dbaPoolV4.xAllocationVoting()).to.equal(xAllocationVotingAddress)

    // V3 storage preserved
    expect(await dbaPoolV4.treasuryAddress()).to.equal(treasuryAddr)
    expect(await dbaPoolV4.meritCapMultiplier()).to.equal(2n)
    expect(await dbaPoolV4.distributionStartRound()).to.equal(7n)
    expect(await dbaPoolV4.dbaRoundRewardsForApp(seededRound, seededAppId)).to.equal(seededAmount)

    // V1/V2 storage still intact
    expect(await dbaPoolV4.x2EarnApps()).to.equal(v3X2EarnApps)
    expect(await dbaPoolV4.xAllocationPool()).to.equal(v3XAllocationPool)
    expect(await dbaPoolV4.x2EarnRewardsPool()).to.equal(v3X2EarnRewardsPool)
    expect(await dbaPoolV4.b3tr()).to.equal(v3B3TR)

    // initializeV4 cannot be called again
    await expect(dbaPoolV4.connect(owner).initializeV4(veBetterPassportAddress, xAllocationVotingAddress)).to.be
      .reverted

    void bootstrapEmissions
    void getVot3Tokens
    void waitForRoundToEnd
  })

  it("Should expose new V4 setters and reject zero addresses", async function () {
    this.timeout(60000)

    const { dynamicBaseAllocationPool, owner } = await getOrDeployContractInstances({
      forceDeploy: true,
    })

    const ZERO = "0x0000000000000000000000000000000000000000"
    await expect(dynamicBaseAllocationPool.connect(owner).setVeBetterPassport(ZERO)).to.be.revertedWith(
      "DBAPool: zero address",
    )
    await expect(dynamicBaseAllocationPool.connect(owner).setXAllocationVoting(ZERO)).to.be.revertedWith(
      "DBAPool: zero address",
    )

    const newAddr = ethers.Wallet.createRandom().address
    await dynamicBaseAllocationPool.connect(owner).setVeBetterPassport(newAddr)
    expect(await dynamicBaseAllocationPool.veBetterPassport()).to.equal(newAddr)

    const anotherAddr = ethers.Wallet.createRandom().address
    await dynamicBaseAllocationPool.connect(owner).setXAllocationVoting(anotherAddr)
    expect(await dynamicBaseAllocationPool.xAllocationVoting()).to.equal(anotherAddr)
  })
})
