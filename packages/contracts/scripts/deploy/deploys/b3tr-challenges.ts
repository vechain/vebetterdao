import { getConfig } from "@repo/config"
import { EnvConfig, getContractsConfig } from "@repo/config/contracts"
import { deployProxy } from "../../helpers"
import { updateConfig } from "../../helpers/config"
import { challengesLibraries } from "../../libraries"
import { B3TRChallenges } from "../../../typechain-types"
import { ethers } from "hardhat"

export async function deployChallenges() {
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

  const requiredAddresses = [
    ["B3TR", envConfig.b3trContractAddress],
    ["VeBetterPassport", envConfig.veBetterPassportContractAddress],
    ["XAllocationVoting", envConfig.xAllocationVotingContractAddress],
    ["X2EarnApps", envConfig.x2EarnAppsContractAddress],
  ] as const

  for (const [name, address] of requiredAddresses) {
    if (!address || address === ethers.ZeroAddress) {
      throw new Error(`${name} contract address not found in config`)
    }
  }

  console.log("Deploying Challenges Libraries")
  const { ChallengeCoreLogic, ChallengeSettlementLogic } = await challengesLibraries({ logOutput: true })
  const libraries = {
    ChallengeCoreLogic: await ChallengeCoreLogic.getAddress(),
    ChallengeSettlementLogic: await ChallengeSettlementLogic.getAddress(),
  }

  const b3trChallenges = (await deployProxy(
    "B3TRChallenges",
    [
      {
        b3trAddress: envConfig.b3trContractAddress,
        veBetterPassportAddress: envConfig.veBetterPassportContractAddress,
        xAllocationVotingAddress: envConfig.xAllocationVotingContractAddress,
        x2EarnAppsAddress: envConfig.x2EarnAppsContractAddress,
        maxChallengeDuration: contractsConfig.CHALLENGES_MAX_DURATION,
        maxSelectedApps: contractsConfig.CHALLENGES_MAX_SELECTED_APPS,
        maxParticipants: contractsConfig.CHALLENGES_MAX_PARTICIPANTS,
        minBetAmount: contractsConfig.CHALLENGES_MIN_BET_AMOUNT,
      },
      {
        admin: contractsConfig.CONTRACTS_ADMIN_ADDRESS,
        upgrader: contractsConfig.CONTRACTS_ADMIN_ADDRESS,
        contractsAddressManager: contractsConfig.CONTRACTS_ADMIN_ADDRESS,
        settingsManager: contractsConfig.CONTRACTS_ADMIN_ADDRESS,
      },
    ],
    libraries,
    undefined,
    true,
  )) as B3TRChallenges

  const challengesAddress = await b3trChallenges.getAddress()

  console.log("B3TRChallenges address: ", challengesAddress)
  console.log("ChallengeCoreLogic library address: ", libraries.ChallengeCoreLogic)
  console.log("ChallengeSettlementLogic library address: ", libraries.ChallengeSettlementLogic)

  const version = await b3trChallenges.version()
  const maxChallengeDuration = await b3trChallenges.maxChallengeDuration()
  const maxSelectedApps = await b3trChallenges.maxSelectedApps()
  const maxParticipants = await b3trChallenges.maxParticipants()
  const minBetAmount = await b3trChallenges.minBetAmount()

  if (
    version !== "1" ||
    maxChallengeDuration !== BigInt(contractsConfig.CHALLENGES_MAX_DURATION) ||
    maxSelectedApps !== BigInt(contractsConfig.CHALLENGES_MAX_SELECTED_APPS) ||
    maxParticipants !== BigInt(contractsConfig.CHALLENGES_MAX_PARTICIPANTS) ||
    minBetAmount !== contractsConfig.CHALLENGES_MIN_BET_AMOUNT
  ) {
    throw new Error("Challenges params are not set correctly")
  }

  const adminAddress = contractsConfig.CONTRACTS_ADMIN_ADDRESS
  const hasAdminRole = await b3trChallenges.hasRole(await b3trChallenges.DEFAULT_ADMIN_ROLE(), adminAddress)
  const hasUpgraderRole = await b3trChallenges.hasRole(await b3trChallenges.UPGRADER_ROLE(), adminAddress)
  const hasContractsAddressManagerRole = await b3trChallenges.hasRole(
    await b3trChallenges.CONTRACTS_ADDRESS_MANAGER_ROLE(),
    adminAddress,
  )
  const hasSettingsManagerRole = await b3trChallenges.hasRole(
    await b3trChallenges.SETTINGS_MANAGER_ROLE(),
    adminAddress,
  )

  if (!hasAdminRole || !hasUpgraderRole || !hasContractsAddressManagerRole || !hasSettingsManagerRole) {
    throw new Error("Challenges roles are not set correctly")
  }

  console.log("================================================================================")
  console.log("Updating the config file with the new B3TRChallenges contract address")
  try {
    Object.assign(envConfig, { challengesContractAddress: challengesAddress })
    await updateConfig(envConfig, "B3TRChallenges")
    console.log("Config file updated successfully")
  } catch (e) {
    console.error("Failed to update config file, update it manually")
  }

  console.log("================================================================================")
  console.log("================  Execution completed")
  process.exit(0)
}

deployChallenges()
