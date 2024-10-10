import { getConfig } from "@repo/config"
import { EnvConfig, getContractsConfig } from "@repo/config/contracts"
import { passportLibraries } from "../../libraries"
import { deployProxyOnly, initializeProxy } from "../../helpers"
import { VeBetterPassport } from "../../../typechain-types"
import { ethers } from "hardhat"
import { transferSettingsManagerRole, validateContractRole } from "../../helpers/roles"

export async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const envConfig = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)
  const contractsConfig = getContractsConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)
  const deployer = (await ethers.getSigners())[0]

  console.log(
    `================  Deploying contracts on ${envConfig.network.name} (${envConfig.nodeUrl}) with ${envConfig.environment} configurations `,
  )
  console.log(`================  Address used to deploy: ${deployer.address}`)

  // We use a temporary admin to deploy and initialize contracts then transfer role to the real admin
  // Also we have many roles in our contracts but we currently use one wallet for all roles
  const TEMP_ADMIN = envConfig.network.name === "solo" ? contractsConfig.CONTRACTS_ADMIN_ADDRESS : deployer.address
  console.log("================================================================================")
  console.log("Temporary admin set to ", TEMP_ADMIN)
  console.log("Final admin will be set to ", contractsConfig.CONTRACTS_ADMIN_ADDRESS)
  console.log("================================================================================")

  console.log("Deploying VeBetter Passport Libraries")
  // Deploy Passport Libraries
  const {
    PassportChecksLogic,
    PassportConfigurator,
    PassportEntityLogic,
    PassportDelegationLogic,
    PassportPersonhoodLogic,
    PassportPoPScoreLogic,
    PassportSignalingLogic,
    PassportWhitelistAndBlacklistLogic,
  } = await passportLibraries()

  const libraries: {
    VeBetterPassport: Record<string, string>
  } = {
    VeBetterPassport: {
      PassportChecksLogic: await PassportChecksLogic.getAddress(),
      PassportConfigurator: await PassportConfigurator.getAddress(),
      PassportEntityLogic: await PassportEntityLogic.getAddress(),
      PassportDelegationLogic: await PassportDelegationLogic.getAddress(),
      PassportPersonhoodLogic: await PassportPersonhoodLogic.getAddress(),
      PassportPoPScoreLogic: await PassportPoPScoreLogic.getAddress(),
      PassportSignalingLogic: await PassportSignalingLogic.getAddress(),
      PassportWhitelistAndBlacklistLogic: await PassportWhitelistAndBlacklistLogic.getAddress(),
    },
  }

  console.log(libraries)

  console.log("Deploying proxy for VeBetter Passport")
  // Initialization requires the address of the x2EarnRewardsPool, for this reason we will initialize it after
  const veBetterPassportContractAddress = await deployProxyOnly("VeBetterPassport", libraries.VeBetterPassport, true)

  const veBetterPassport = (await initializeProxy(
    veBetterPassportContractAddress,
    "VeBetterPassport",
    [
      {
        x2EarnApps: envConfig.x2EarnAppsContractAddress,
        xAllocationVoting: envConfig.xAllocationVotingContractAddress,
        galaxyMember: envConfig.galaxyMemberContractAddress,
        popScoreThreshold: contractsConfig.VEPASSPORT_PARTICIPATION_SCORE_THRESHOLD, //threshold
        signalingThreshold: contractsConfig.VEPASSPORT_BOT_SIGNALING_THRESHOLD, //signalingThreshold
        roundsForCumulativeScore: contractsConfig.VEPASSPORT_ROUNDS_FOR_CUMULATIVE_PARTICIPATION_SCORE, //roundsForCumulativeScore
        minimumGalaxyMemberLevel: contractsConfig.VEPASSPORT_GALAXY_MEMBER_MINIMUM_LEVEL, //galaxyMemberMinimumLevel
        blacklistThreshold: contractsConfig.VEPASSPORT_BLACKLIST_THRESHOLD, //blacklistThreshold
        whitelistThreshold: contractsConfig.VEBETTER_WHITELIST_THRESHOLD, //whitelistThreshold
        maxEntitiesPerPassport: contractsConfig.VEBETTER_PASSPORT_MAX_ENTITIES, //maxEntitiesPerPassport
      },
      {
        admin: contractsConfig.CONTRACTS_ADMIN_ADDRESS, // admins
        botSignaler: contractsConfig.CONTRACTS_ADMIN_ADDRESS, // botSignaler
        upgrader: contractsConfig.CONTRACTS_ADMIN_ADDRESS, // upgrader
        settingsManager: TEMP_ADMIN, // settingsManager
        roleGranter: contractsConfig.CONTRACTS_ADMIN_ADDRESS, // roleGranter
        blacklister: contractsConfig.CONTRACTS_ADMIN_ADDRESS, // blacklister
        whitelister: contractsConfig.CONTRACTS_ADMIN_ADDRESS, // whitelistManager
        actionRegistrar: contractsConfig.CONTRACTS_ADMIN_ADDRESS, // actionRegistrar
        actionScoreManager: contractsConfig.CONTRACTS_ADMIN_ADDRESS, // actionScoreManager
      },
    ],
    libraries.VeBetterPassport,
  )) as VeBetterPassport

  console.log(`================  Contract deployed `)
  console.log(`================  Configuring contract `)

  console.log("Enable Participation Score for VeBetterPassport")
  await veBetterPassport
    .connect(deployer)
    .toggleCheck(4)
    .then(async tx => await tx.wait())

  console.log("Transfer settingsManager role to the final admin")
  await transferSettingsManagerRole(veBetterPassport, deployer, contractsConfig.CONTRACTS_ADMIN_ADDRESS)

  console.log("Validating contract role for VeBetterPassport")
  await validateContractRole(
    veBetterPassport,
    contractsConfig.CONTRACTS_ADMIN_ADDRESS,
    TEMP_ADMIN,
    await veBetterPassport.SETTINGS_MANAGER_ROLE(),
  )

  console.log("Execution completed")
  process.exit(0)
}

// Execute the main function
main()
