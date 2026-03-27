import { getConfig } from "@repo/config"
import { getContractsConfig } from "@repo/config/contracts"
import { upgradeProxy } from "../../../helpers"
import { EnvConfig } from "@repo/config/contracts"
import { VoterRewards } from "../../../../typechain-types"
import { ethers } from "hardhat"

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const envConfig = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)
  const config = getContractsConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  // Get the current round start timepoint for the neutral checkpoint
  console.log("Getting current round snapshot for neutral checkpoint...")
  const xAllocationVoting = await ethers.getContractAt("XAllocationVoting", envConfig.xAllocationVotingContractAddress)
  const currentRoundId = await xAllocationVoting.currentRoundId()
  const roundStartTimepoint = currentRoundId > 0 ? await xAllocationVoting.roundSnapshot(currentRoundId) : 0
  console.log(`Current round: ${currentRoundId}, snapshot: ${roundStartTimepoint}`)

  console.log(
    `Upgrading VoterRewards contract at address: ${envConfig.voterRewardsContractAddress} on network: ${envConfig.network.name}`,
  )

  // V7: Rewards multipliers (freshness + governance intent)
  // initializeV7 creates two checkpoints per multiplier:
  // 1. At round start → neutral (1x) so current round is unaffected
  // 2. At current block → real values (takes effect next round)
  const voterRewardsV7 = (await upgradeProxy(
    "VoterRewardsV6",
    "VoterRewards",
    envConfig.voterRewardsContractAddress,
    [
      roundStartTimepoint,
      config.VOTER_REWARDS_FRESHNESS_MULTIPLIER_TIER1,
      config.VOTER_REWARDS_FRESHNESS_MULTIPLIER_TIER2,
      config.VOTER_REWARDS_FRESHNESS_MULTIPLIER_TIER3,
      config.VOTER_REWARDS_INTENT_MULTIPLIER_FOR_AGAINST,
      config.VOTER_REWARDS_INTENT_MULTIPLIER_ABSTAIN,
    ],
    {
      version: 7,
    },
  )) as VoterRewards

  console.log(`VoterRewards upgraded`)

  const version = await voterRewardsV7.version()
  console.log(`New VoterRewards version: ${version}`)

  if (parseInt(version) !== 7) {
    throw new Error(`VoterRewards version is not 7: ${version}`)
  }

  // Grant GOVERNANCE_ROLE to timelock for multiplier governance
  const deployer = (await ethers.getSigners())[0]
  const GOVERNANCE_ROLE = await voterRewardsV7.GOVERNANCE_ROLE()

  console.log("Granting GOVERNANCE_ROLE to timelock...")
  await voterRewardsV7
    .connect(deployer)
    .grantRole(GOVERNANCE_ROLE, envConfig.timelockContractAddress)
    .then(async tx => await tx.wait())

  const hasRole = await voterRewardsV7.hasRole(GOVERNANCE_ROLE, envConfig.timelockContractAddress)
  if (!hasRole) {
    throw new Error("Failed to grant GOVERNANCE_ROLE to timelock in VoterRewards")
  }

  console.log("VoterRewards v7 upgrade completed successfully")
  console.log("Rewards multipliers initialized:")
  console.log(
    `  Freshness: ${config.VOTER_REWARDS_FRESHNESS_MULTIPLIER_TIER1} / ${config.VOTER_REWARDS_FRESHNESS_MULTIPLIER_TIER2} / ${config.VOTER_REWARDS_FRESHNESS_MULTIPLIER_TIER3}`,
  )
  console.log(
    `  Intent: For/Against=${config.VOTER_REWARDS_INTENT_MULTIPLIER_FOR_AGAINST}, Abstain=${config.VOTER_REWARDS_INTENT_MULTIPLIER_ABSTAIN}`,
  )
  console.log("Execution completed")
  process.exit(0)
}

main()
