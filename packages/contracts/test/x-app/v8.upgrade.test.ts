import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { ContractsConfig } from "@repo/config/contracts"
import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { expect } from "chai"

import { deployAndUpgrade, upgradeProxy } from "../../scripts/helpers"
import { X2EarnApps, X2EarnAppsV7 } from "../../typechain-types"
import { getOrDeployContractInstances } from "../helpers"

let config: ContractsConfig
let otherAccounts: SignerWithAddress[]
let owner: SignerWithAddress

describe("X-Apps - V8 Upgrade - @shard15f", function () {
  beforeEach(async function () {
    config = createLocalConfig()

    const contracts = await getOrDeployContractInstances({
      forceDeploy: true,
      deployMocks: true,
    })

    if (!contracts) {
      throw new Error("Contracts not deployed")
    }

    otherAccounts = contracts.otherAccounts
    owner = contracts.owner
  })

  it("Should upgrade from V7 to V8", async function () {
    const {
      timeLock,
      nodeManagement,
      veBetterPassport,
      x2EarnCreator,
      xAllocationVoting: freshXAllocationVoting,
      x2EarnRewardsPool,
      stargateNftMock: freshStargateNftMock,

      // X2EarnApps V2
      administrationUtilsV2,
      endorsementUtilsV2,
      voteEligibilityUtilsV2,
      // X2EarnApps V3
      administrationUtilsV3,
      endorsementUtilsV3,
      voteEligibilityUtilsV3,
      // X2EarnApps V4
      administrationUtilsV4,
      endorsementUtilsV4,
      voteEligibilityUtilsV4,
      // X2EarnApps V5
      administrationUtilsV5,
      endorsementUtilsV5,
      voteEligibilityUtilsV5,
      // X2EarnApps V6
      administrationUtilsV6,
      endorsementUtilsV6,
      voteEligibilityUtilsV6,
      // X2EarnApps V7
      administrationUtilsV7,
      endorsementUtilsV7,
      voteEligibilityUtilsV7,
      // Latest
      administrationUtils,
      endorsementUtils,
      voteEligibilityUtils,
    } = await getOrDeployContractInstances({ forceDeploy: true, deployMocks: true })

    const x2EarnAppsV7 = (await deployAndUpgrade(
      ["X2EarnAppsV1", "X2EarnAppsV2", "X2EarnAppsV3", "X2EarnAppsV4", "X2EarnAppsV5", "X2EarnAppsV6", "X2EarnAppsV7"],
      [
        ["ipfs://", [await timeLock.getAddress(), owner.address], owner.address, owner.address],
        [
          config.XAPP_GRACE_PERIOD,
          await nodeManagement.getAddress(),
          await veBetterPassport.getAddress(),
          await x2EarnCreator.getAddress(),
        ],
        [config.X2EARN_NODE_COOLDOWN_PERIOD, await freshXAllocationVoting.getAddress()],
        [await x2EarnRewardsPool.getAddress()],
        [],
        [],
        [await freshStargateNftMock.getAddress()],
      ],
      {
        versions: [undefined, 2, 3, 4, 5, 6, 7],
        libraries: [
          undefined,
          {
            AdministrationUtilsV2: await administrationUtilsV2.getAddress(),
            EndorsementUtilsV2: await endorsementUtilsV2.getAddress(),
            VoteEligibilityUtilsV2: await voteEligibilityUtilsV2.getAddress(),
          },
          {
            AdministrationUtilsV3: await administrationUtilsV3.getAddress(),
            EndorsementUtilsV3: await endorsementUtilsV3.getAddress(),
            VoteEligibilityUtilsV3: await voteEligibilityUtilsV3.getAddress(),
          },
          {
            AdministrationUtilsV4: await administrationUtilsV4.getAddress(),
            EndorsementUtilsV4: await endorsementUtilsV4.getAddress(),
            VoteEligibilityUtilsV4: await voteEligibilityUtilsV4.getAddress(),
          },
          {
            AdministrationUtilsV5: await administrationUtilsV5.getAddress(),
            EndorsementUtilsV5: await endorsementUtilsV5.getAddress(),
            VoteEligibilityUtilsV5: await voteEligibilityUtilsV5.getAddress(),
          },
          {
            AdministrationUtilsV6: await administrationUtilsV6.getAddress(),
            EndorsementUtilsV6: await endorsementUtilsV6.getAddress(),
            VoteEligibilityUtilsV6: await voteEligibilityUtilsV6.getAddress(),
          },
          {
            AdministrationUtilsV7: await administrationUtilsV7.getAddress(),
            EndorsementUtilsV7: await endorsementUtilsV7.getAddress(),
            VoteEligibilityUtilsV7: await voteEligibilityUtilsV7.getAddress(),
          },
        ],
      },
    )) as X2EarnAppsV7

    const x2EarnAppsV8 = (await upgradeProxy("X2EarnAppsV7", "X2EarnApps", await x2EarnAppsV7.getAddress(), [], {
      version: 8,
      libraries: {
        AdministrationUtils: await administrationUtils.getAddress(),
        EndorsementUtils: await endorsementUtils.getAddress(),
        VoteEligibilityUtils: await voteEligibilityUtils.getAddress(),
      },
    })) as X2EarnApps

    expect(await x2EarnAppsV8.version()).to.equal("8")
    expect(await x2EarnAppsV8.getStargateNFT()).to.equal(await freshStargateNftMock.getAddress())

    // quick sanity: contract still callable
    const appId = await x2EarnAppsV8.hashAppName(otherAccounts[0].address)
    await x2EarnAppsV8
      .connect(owner)
      .submitApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
    expect(await x2EarnAppsV8.isAppUnendorsed(appId)).to.eql(true)
  })
})
