import { getConfig } from "@repo/config"
import { EnvConfig, getContractsConfig } from "@repo/config/contracts"
import { deployProxy } from "../../helpers"
import { NavigatorRegistry } from "../../../typechain-types"
import { ethers } from "hardhat"
import { updateConfig } from "../../helpers/config"
import { navigatorRegistryLibraries } from "../../libraries/navigatorRegistryLibraries"

export async function deployNavigatorRegistry() {
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

  const TEMP_ADMIN = envConfig.network.name === "solo" ? contractsConfig.CONTRACTS_ADMIN_ADDRESS : deployer.address
  console.log("================================================================================")
  console.log("Temporary admin set to ", TEMP_ADMIN)
  console.log("Final admin will be set to ", contractsConfig.CONTRACTS_ADMIN_ADDRESS)
  console.log("================================================================================")

  const B3TR_ADDRESS = envConfig.b3trContractAddress
  const VOT3_ADDRESS = envConfig.vot3ContractAddress
  const TREASURY_ADDRESS = envConfig.treasuryContractAddress
  const VOTER_REWARDS_ADDRESS = envConfig.voterRewardsContractAddress

  console.log("Deploying NavigatorRegistry libraries...")
  const navLibs = await navigatorRegistryLibraries(true)
  const libraryAddresses: Record<string, string> = {
    NavigatorStakingUtils: await navLibs.NavigatorStakingUtils.getAddress(),
    NavigatorDelegationUtils: await navLibs.NavigatorDelegationUtils.getAddress(),
    NavigatorVotingUtils: await navLibs.NavigatorVotingUtils.getAddress(),
    NavigatorFeeUtils: await navLibs.NavigatorFeeUtils.getAddress(),
    NavigatorSlashingUtils: await navLibs.NavigatorSlashingUtils.getAddress(),
    NavigatorLifecycleUtils: await navLibs.NavigatorLifecycleUtils.getAddress(),
  }

  console.log("Deploying proxy for NavigatorRegistry with params:")
  console.log("B3TR Address: ", B3TR_ADDRESS)
  console.log("VOT3 Address: ", VOT3_ADDRESS)
  console.log("Treasury Address: ", TREASURY_ADDRESS)
  console.log("VoterRewards Address: ", VOTER_REWARDS_ADDRESS)
  console.log("Min Stake: ", contractsConfig.NAVIGATOR_MIN_STAKE.toString())
  console.log("Max Stake Percentage: ", contractsConfig.NAVIGATOR_MAX_STAKE_PERCENTAGE)
  console.log("Fee Lock Period: ", contractsConfig.NAVIGATOR_FEE_LOCK_PERIOD)
  console.log("Fee Percentage: ", contractsConfig.NAVIGATOR_FEE_PERCENTAGE)
  console.log("Exit Notice Period: ", contractsConfig.NAVIGATOR_EXIT_NOTICE_PERIOD)
  console.log("Report Interval: ", contractsConfig.NAVIGATOR_REPORT_INTERVAL)
  console.log("Minor Slash Percentage: ", contractsConfig.NAVIGATOR_MINOR_SLASH_PERCENTAGE)
  console.log("Preference Cutoff Period: ", contractsConfig.NAVIGATOR_PREFERENCE_CUTOFF_PERIOD)

  const navigatorRegistry = (await deployProxy(
    "NavigatorRegistry",
    [
      {
        admin: TEMP_ADMIN,
        upgrader: TEMP_ADMIN,
        governance: TEMP_ADMIN,
        b3trToken: B3TR_ADDRESS,
        vot3Token: VOT3_ADDRESS,
        treasury: TREASURY_ADDRESS,
        minStake: contractsConfig.NAVIGATOR_MIN_STAKE,
        maxStakePercentage: contractsConfig.NAVIGATOR_MAX_STAKE_PERCENTAGE,
        feeLockPeriod: contractsConfig.NAVIGATOR_FEE_LOCK_PERIOD,
        feePercentage: contractsConfig.NAVIGATOR_FEE_PERCENTAGE,
        exitNoticePeriod: contractsConfig.NAVIGATOR_EXIT_NOTICE_PERIOD,
        reportInterval: contractsConfig.NAVIGATOR_REPORT_INTERVAL,
        minorSlashPercentage: contractsConfig.NAVIGATOR_MINOR_SLASH_PERCENTAGE,
        preferenceCutoffPeriod: contractsConfig.NAVIGATOR_PREFERENCE_CUTOFF_PERIOD,
        voterRewards: VOTER_REWARDS_ADDRESS,
      },
    ],
    libraryAddresses,
  )) as NavigatorRegistry

  console.log(`================  Contract deployed at ${await navigatorRegistry.getAddress()}`)

  console.log("Checking that params are set correctly")
  const minStake = await navigatorRegistry.getMinStake()
  const feePercentage = await navigatorRegistry.getFeePercentage()
  const feeLockPeriod = await navigatorRegistry.getFeeLockPeriod()
  const exitNoticePeriod = await navigatorRegistry.getExitNoticePeriod()

  if (
    minStake !== contractsConfig.NAVIGATOR_MIN_STAKE ||
    feePercentage !== BigInt(contractsConfig.NAVIGATOR_FEE_PERCENTAGE) ||
    feeLockPeriod !== BigInt(contractsConfig.NAVIGATOR_FEE_LOCK_PERIOD) ||
    exitNoticePeriod !== BigInt(contractsConfig.NAVIGATOR_EXIT_NOTICE_PERIOD)
  ) {
    console.log("ERROR: Params are not set correctly")
    process.exit(1)
  }

  console.log("================  Configuring roles")
  console.log(
    "INFO: roles will not be set automatically in this script, allowing the deployer to handle possible issues in the next days",
  )
  console.log("INFO: Remember to grant UPGRADER_ROLE and GOVERNANCE_ROLE to the appropriate addresses")
  console.log(
    "INFO: Remember to set the NavigatorRegistry address in XAllocationVoting, B3TRGovernor, and VoterRewards contracts",
  )

  console.log("================================================================================")
  console.log(`Updating the config file with the new NavigatorRegistry contract address`)
  try {
    Object.assign(envConfig, { navigatorRegistryContractAddress: await navigatorRegistry.getAddress() })
    await updateConfig(envConfig, "NavigatorRegistry")
    console.log("Config file updated successfully")
  } catch (e) {
    console.error("Failed to update config file, update it manually")
  }

  console.log("================================================================================")
  console.log("NavigatorRegistry address: ", await navigatorRegistry.getAddress())
  console.log("================  Execution completed")
  process.exit(0)
}

deployNavigatorRegistry()
