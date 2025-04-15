import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { ethers } from "hardhat"
import { deployProxyOnly, initializeProxy, upgradeProxy } from "../../scripts/helpers"
import { passportLibraries } from "../../scripts/libraries/passportLibraries"
import { createLocalConfig } from "@repo/config/contracts/envs/local"

import { VeBetterPassport, VeBetterPassportV1, VeBetterPassportV2, VeBetterPassportV3 } from "../../typechain-types"

interface DeployPassportOptions {
  stopAfterVersion?: 1 | 2 | 3 // Option to stop after a specific version
  config?: any
  owner?: HardhatEthersSigner
  x2EarnAppsAddress?: string
  xAllocationVotingAddress?: string
  galaxyMemberAddress?: string
}

export interface DeployedPassport {
  proxyAddress: string
  veBetterPassportV1?: VeBetterPassportV1
  veBetterPassportV2?: VeBetterPassportV2
  veBetterPassportV3?: VeBetterPassportV3
  veBetterPassport: VeBetterPassport | VeBetterPassportV3 | VeBetterPassportV2 | VeBetterPassportV1
}

/**
 * Deploys the VeBetterPassport contract series (V1 up to latest V4 or specified stop version).
 * It deploys necessary libraries internally.
 */
export async function deployVeBetterPassportUpgradable(options: DeployPassportOptions = {}): Promise<DeployedPassport> {
  const {
    stopAfterVersion,
    config = createLocalConfig(),
    owner: providedOwner,
    x2EarnAppsAddress: providedX2EarnApps,
    xAllocationVotingAddress: providedXAllocationVoting,
    galaxyMemberAddress: providedGalaxyMember,
  } = options

  const owner = providedOwner ?? (await ethers.getSigners())[0]

  // Use provided addresses or default to owner address for simplicity in isolated tests
  const x2EarnAppsAddr = providedX2EarnApps ?? owner.address
  const xAllocationVotingAddr = providedXAllocationVoting ?? owner.address
  const galaxyMemberAddr = providedGalaxyMember ?? owner.address

  // 1. Deploy all necessary Passport Libraries for all versions
  const libs = await passportLibraries()

  // 2. Deploy V1 Proxy Only
  const proxyAddress = await deployProxyOnly("VeBetterPassportV1", {
    PassportChecksLogicV1: await libs.PassportChecksLogicV1.getAddress(),
    PassportConfiguratorV1: await libs.PassportConfiguratorV1.getAddress(),
    PassportEntityLogicV1: await libs.PassportEntityLogicV1.getAddress(),
    PassportDelegationLogicV1: await libs.PassportDelegationLogicV1.getAddress(),
    PassportPersonhoodLogicV1: await libs.PassportPersonhoodLogicV1.getAddress(),
    PassportPoPScoreLogicV1: await libs.PassportPoPScoreLogicV1.getAddress(),
    PassportSignalingLogicV1: await libs.PassportSignalingLogicV1.getAddress(),
    PassportWhitelistAndBlacklistLogicV1: await libs.PassportWhitelistAndBlacklistLogicV1.getAddress(),
  })

  // 3. Initialize V1
  const veBetterPassportV1 = (await initializeProxy(
    proxyAddress,
    "VeBetterPassportV1",
    [
      {
        x2EarnApps: x2EarnAppsAddr,
        xAllocationVoting: xAllocationVotingAddr,
        galaxyMember: galaxyMemberAddr,
        signalingThreshold: config.VEPASSPORT_BOT_SIGNALING_THRESHOLD,
        roundsForCumulativeScore: config.VEPASSPORT_ROUNDS_FOR_CUMULATIVE_PARTICIPATION_SCORE,
        minimumGalaxyMemberLevel: config.VEPASSPORT_GALAXY_MEMBER_MINIMUM_LEVEL,
        blacklistThreshold: config.VEPASSPORT_BLACKLIST_THRESHOLD_PERCENTAGE,
        whitelistThreshold: config.VEPASSPORT_WHITELIST_THRESHOLD_PERCENTAGE,
        maxEntitiesPerPassport: config.VEPASSPORT_PASSPORT_MAX_ENTITIES,
        decayRate: config.VEPASSPORT_DECAY_RATE,
      },
      {
        admin: owner.address,
        botSignaler: owner.address,
        upgrader: owner.address,
        settingsManager: owner.address,
        roleGranter: owner.address,
        blacklister: owner.address,
        whitelister: owner.address,
        actionRegistrar: owner.address,
        actionScoreManager: owner.address,
      },
    ],
    {
      PassportChecksLogicV1: await libs.PassportChecksLogicV1.getAddress(),
      PassportConfiguratorV1: await libs.PassportConfiguratorV1.getAddress(),
      PassportEntityLogicV1: await libs.PassportEntityLogicV1.getAddress(),
      PassportDelegationLogicV1: await libs.PassportDelegationLogicV1.getAddress(),
      PassportPersonhoodLogicV1: await libs.PassportPersonhoodLogicV1.getAddress(),
      PassportPoPScoreLogicV1: await libs.PassportPoPScoreLogicV1.getAddress(),
      PassportSignalingLogicV1: await libs.PassportSignalingLogicV1.getAddress(),
      PassportWhitelistAndBlacklistLogicV1: await libs.PassportWhitelistAndBlacklistLogicV1.getAddress(),
    },
  )) as VeBetterPassportV1

  if (stopAfterVersion === 1) {
    return { proxyAddress, veBetterPassportV1, veBetterPassport: veBetterPassportV1 }
  }

  // 4. Upgrade V1 -> V2
  const veBetterPassportV2 = (await upgradeProxy("VeBetterPassportV1", "VeBetterPassportV2", proxyAddress, [], {
    version: 2,
    libraries: {
      PassportChecksLogicV2: await libs.PassportChecksLogicV2.getAddress(),
      PassportConfiguratorV2: await libs.PassportConfiguratorV2.getAddress(),
      PassportEntityLogicV2: await libs.PassportEntityLogicV2.getAddress(),
      PassportDelegationLogicV2: await libs.PassportDelegationLogicV2.getAddress(),
      PassportPersonhoodLogicV2: await libs.PassportPersonhoodLogicV2.getAddress(),
      PassportPoPScoreLogicV2: await libs.PassportPoPScoreLogicV2.getAddress(),
      PassportSignalingLogicV2: await libs.PassportSignalingLogicV2.getAddress(),
      PassportWhitelistAndBlacklistLogicV2: await libs.PassportWhitelistAndBlacklistLogicV2.getAddress(),
    },
  })) as VeBetterPassportV2

  if (stopAfterVersion === 2) {
    return { proxyAddress, veBetterPassportV1, veBetterPassportV2, veBetterPassport: veBetterPassportV2 }
  }

  // 5. Upgrade V2 -> V3
  const veBetterPassportV3 = (await upgradeProxy("VeBetterPassportV2", "VeBetterPassportV3", proxyAddress, [], {
    version: 3,
    libraries: {
      PassportChecksLogicV3: await libs.PassportChecksLogicV3.getAddress(),
      PassportConfiguratorV3: await libs.PassportConfiguratorV3.getAddress(),
      PassportEntityLogicV3: await libs.PassportEntityLogicV3.getAddress(),
      PassportDelegationLogicV3: await libs.PassportDelegationLogicV3.getAddress(),
      PassportPersonhoodLogicV3: await libs.PassportPersonhoodLogicV3.getAddress(),
      PassportPoPScoreLogicV3: await libs.PassportPoPScoreLogicV3.getAddress(),
      PassportSignalingLogicV3: await libs.PassportSignalingLogicV3.getAddress(),
      PassportWhitelistAndBlacklistLogicV3: await libs.PassportWhitelistAndBlacklistLogicV3.getAddress(),
    },
  })) as VeBetterPassportV3

  if (stopAfterVersion === 3) {
    return {
      proxyAddress,
      veBetterPassportV1,
      veBetterPassportV2,
      veBetterPassportV3,
      veBetterPassport: veBetterPassportV3,
    }
  }

  // 6. Upgrade V3 -> V4 (Latest)
  const veBetterPassport = (await upgradeProxy(
    "VeBetterPassportV3",
    "VeBetterPassport",
    proxyAddress,
    [owner.address], // resetSignaler
    {
      version: 4,
      libraries: {
        PassportChecksLogic: await libs.PassportChecksLogic.getAddress(),
        PassportConfigurator: await libs.PassportConfigurator.getAddress(),
        PassportEntityLogic: await libs.PassportEntityLogic.getAddress(),
        PassportDelegationLogic: await libs.PassportDelegationLogic.getAddress(),
        PassportPersonhoodLogic: await libs.PassportPersonhoodLogic.getAddress(),
        PassportPoPScoreLogic: await libs.PassportPoPScoreLogic.getAddress(),
        PassportSignalingLogic: await libs.PassportSignalingLogic.getAddress(),
        PassportWhitelistAndBlacklistLogic: await libs.PassportWhitelistAndBlacklistLogic.getAddress(),
      },
    },
  )) as VeBetterPassport

  return {
    proxyAddress,
    veBetterPassportV1,
    veBetterPassportV2,
    veBetterPassportV3,
    veBetterPassport, // V4
  }
}
